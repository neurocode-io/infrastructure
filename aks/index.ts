import * as pulumi from '@pulumi/pulumi'
import * as azure from '@pulumi/azure-native'
import { aksResourceGroup, createCluster } from './src/aks'

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

const creds = pulumi
  .all([cluster.name, aksResourceGroup.name])
  .apply(([clusterName, rgName]) => {
    return azure.containerservice.listManagedClusterUserCredentials({
      resourceGroupName: rgName,
      resourceName: clusterName,
    })
  })

const encoded = creds.kubeconfigs[0].value
export const kubeConfig = encoded.apply((enc) =>
  Buffer.from(enc, 'base64').toString(),
)
