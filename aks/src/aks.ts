import * as azure from '@pulumi/azure-native'
import * as pulumi from '@pulumi/pulumi'
import { AKS, prefix, location, tags } from '../config'

type ClusterOpts = {
  egressIp: pulumi.Output<azure.network.PublicIPAddress>
  subnet: pulumi.Output<azure.network.Subnet>
}

const isSpotPool = Object.keys(AKS.dataPlane).includes('spot')

export const aksResourceGroup = new azure.resources.ResourceGroup(
  `${prefix}-rg-aks`,
  {
    location,
  },
)

export const createCluster = (opts: ClusterOpts) => {
  opts.subnet.addressPrefix.apply((cidr) => {
    if (!cidr) throw new Error('Cidr needed')

    const range = cidr.split('/').shift()
    if (!range) throw new Error('Wrong cidr')
    if (['172.29.0.0', '10.243.0.0', '10.244.0.0'].includes(range))
      throw new Error('Cidr unusable')
  })

  return new azure.containerservice.ManagedCluster(`${prefix}-aks`, {
    resourceGroupName: aksResourceGroup.name,
    location,
    autoUpgradeProfile: isSpotPool ? undefined : { upgradeChannel: 'rapid' },
    aadProfile: {
      adminGroupObjectIDs: AKS.adminGroupIds,
      enableAzureRBAC: true,
      managed: true,
    },
    addonProfiles: {
      KubeDashboard: {
        enabled: false,
      },
    },
    networkProfile: {
      networkPlugin: 'azure',
      networkPolicy: 'azure', // calico ?
      loadBalancerSku: 'standard',
      serviceCidr: '172.29.0.0/16',
      dnsServiceIP: '172.29.0.10',
      podCidr: '10.244.0.0/16',
      dockerBridgeCidr: '10.243.0.1/16',
      loadBalancerProfile: {
        outboundIPs: {
          publicIPs: [{ id: opts.egressIp.id }],
        },
      },
    },
    podIdentityProfile: {
      enabled: false,
    },
    agentPoolProfiles: [
      {
        count: AKS.controlPlane.zones.length,
        enableNodePublicIP: false,
        kubeletConfig: {
          containerLogMaxFiles: 50,
          containerLogMaxSizeMB: 10,
        },
        availabilityZones: AKS.controlPlane.zones,
        maxPods: 30,
        mode: 'System',
        name: 'agentpool',
        vnetSubnetID: opts.subnet.id,
        osDiskSizeGB: 0,
        osType: 'Linux',
        type: 'VirtualMachineScaleSets',
        vmSize: AKS.controlPlane.vmSize,
        nodeLabels: {
          target: 'system',
        },
      },
    ],
    dnsPrefix: `${prefix}-aks`,
    enableRBAC: true,
    identity: {
      type: 'SystemAssigned',
    },
    kubernetesVersion: AKS.version,
    nodeResourceGroup: `${prefix}-aks-nodes`,
    tags,
  })
}

export const createSpotPool = (
  cluster: azure.containerservice.ManagedCluster,
) => {
  if (!isSpotPool) return

  return new azure.containerservice.AgentPool(`${prefix}-aks-spot-pool`, {
    mode: 'User',
    scaleSetEvictionPolicy: 'delete',
    scaleSetPriority: 'spot',
    spotMaxPrice: -1,
    enableAutoScaling: true,
    type: 'VirtualMachineScaleSets',
    agentPoolName: 'spot',
    kubeletConfig: {
      containerLogMaxFiles: 50,
      containerLogMaxSizeMB: 10,
    },
    linuxOSConfig: {},
    count: AKS.dataPlane.spot.minCount,
    minCount: AKS.dataPlane.spot.minCount,
    maxCount: AKS.dataPlane.spot.maxCount,
    maxPods: 110,
    availabilityZones: AKS.dataPlane.spot.zones,
    resourceGroupName: aksResourceGroup.name,
    resourceName: cluster.name,
    osDiskSizeGB: 0,
    osType: 'Linux',
    vmSize: AKS.dataPlane.spot.vmSize,
    nodeLabels: {
      target: 'spot',
    },
    tags,
  })
}
