import * as pulumi from '@pulumi/pulumi'
import * as azure from '@pulumi/azure-native'
import { aksResourceGroup, createCluster, createSpotPool } from './src/aks'

const env = pulumi.getStack()
const infra = new pulumi.StackReference(`neurocode/network/${env}`)
const publicIp = infra.getOutput('egressIp') as pulumi.Output<
  azure.network.PublicIPAddress
>
const subnet = infra.getOutput('aksSubnet') as pulumi.Output<
  azure.network.Subnet
>

const cluster = createCluster({
  egressIp: publicIp,
  subnet,
})

createSpotPool(cluster)

export const principalId = cluster.identity.apply(
  (identity) => identity?.principalId,
)

export const getAksCreds = pulumi.interpolate`az aks get-credentials --resource-group ${aksResourceGroup.name}  --name ${cluster.name}`
export const aksUpdateCheck = pulumi.interpolate`az aks get-upgrades --resource-group ${aksResourceGroup.name}  --name ${cluster.name}`
