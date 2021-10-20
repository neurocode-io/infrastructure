import * as azure from '@pulumi/azure-native'
import { AKS, prefix, location, tags } from '../config'
import { askSubnet1, aksVnetResourceGroup } from './vnet'

export const aksResourceGroup = new azure.resources.ResourceGroup(
  `${prefix}-rg-aks`,
  {
    location,
  },
)

const egressIp = new azure.network.PublicIPAddress(`${prefix}-aks-egress`, {
  resourceGroupName: aksVnetResourceGroup.name,
  publicIPAllocationMethod: 'Static',
  sku: {
    name: 'Standard',
  },
  tags,
})

export const cluster = new azure.containerservice.ManagedCluster(
  `${prefix}-aks`,
  {
    resourceGroupName: aksResourceGroup.name,
    location,
    autoUpgradeProfile: {
      upgradeChannel: 'rapid',
    },
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
      loadBalancerProfile: {
        outboundIPs: { publicIPs: [{ id: egressIp.id }] },
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
        vnetSubnetID: askSubnet1.id,
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
  },
)

// const appSpotPool = new azure.containerservice.AgentPool(
//   `${prefix}-aks-apps-pool`,
//   {
//     mode: 'User',
//     scaleSetEvictionPolicy: 'delete',
//     scaleSetPriority: 'spot',
//     spotMaxPrice: -1,
//     enableAutoScaling: true,
//     type: 'VirtualMachineScaleSets',
//     agentPoolName: 'apps',
//     kubeletConfig: {
//       containerLogMaxFiles: 50,
//       containerLogMaxSizeMB: 10,
//     },
//     linuxOSConfig: {},
//     count: AKS.dataPlane.spot.minCount,
//     minCount: AKS.dataPlane.spot.minCount,
//     maxCount: AKS.dataPlane.spot.maxCount,
//     maxPods: 110,
//     availabilityZones: AKS.dataPlane.spot.zones,
//     resourceGroupName: aksResourceGroup.name,
//     resourceName: cluster.name,
//     osDiskSizeGB: 0,
//     osType: 'Linux',
//     vmSize: AKS.dataPlane.spot.vmSize,
//     vnetSubnetID: askSubnet1.id,
//     nodeLabels: {
//       target: 'apps',
//     },
//     tags,
//   },
// )
