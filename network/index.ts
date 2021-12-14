import * as azure from '@pulumi/azure-native'
import { prefix, location, tags, subnetCidrs, vnetCidrs } from './config'

const aksVnetResourceGroup = new azure.resources.ResourceGroup(
  `${prefix}-rg-aksvnet`,
  { location },
)

const aksVnet = new azure.network.VirtualNetwork(`${prefix}-aksvnet`, {
  location: aksVnetResourceGroup.location,
  resourceGroupName: aksVnetResourceGroup.name,
  addressSpace: { addressPrefixes: vnetCidrs },
  tags: {
    managedBy: 'pulumi',
  },
})

export const aksSubnet = subnetCidrs
  .map((subnetCidr) => {
    if (subnetCidr['aks']) {
      return new azure.network.Subnet(`${prefix}-akssubnet`, {
        resourceGroupName: aksVnetResourceGroup.name,
        virtualNetworkName: aksVnet.name,
        addressPrefix: subnetCidr['aks'],
      })
    }
    return
  })
  .shift()

export const egressIp = new azure.network.PublicIPAddress(
  `${prefix}-aks-egress`,
  {
    resourceGroupName: aksVnetResourceGroup.name,
    publicIPAllocationMethod: 'Static',
    sku: {
      name: 'Standard',
    },
    tags,
  },
)

export const vnetRgName = aksVnetResourceGroup.name
export const publicIp = egressIp.ipAddress
