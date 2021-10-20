import * as azure from '@pulumi/azure-native'
import { prefix, location } from '../config'

export const aksVnetResourceGroup = new azure.resources.ResourceGroup(
  `${prefix}-rg-aksvnet`,
  { location },
)

const aksVnet = new azure.network.VirtualNetwork(`${prefix}-aksvnet`, {
  location: aksVnetResourceGroup.location,
  resourceGroupName: aksVnetResourceGroup.name,
  addressSpace: { addressPrefixes: ['10.1.0.0/18'] },
  tags: {
    managedBy: 'pulumi',
  },
})

export const askSubnet1 = new azure.network.Subnet(`${prefix}-akssubnet`, {
  resourceGroupName: aksVnetResourceGroup.name,
  virtualNetworkName: aksVnet.name,
  addressPrefix: '10.1.0.0/20',
})
