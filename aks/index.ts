import * as pulumi from '@pulumi/pulumi'
import * as containerservice from '@pulumi/azure-native/containerservice'
import { aksResourceGroup, cluster, egressIp } from './src/aks'

const creds = pulumi
  .all([cluster.name, aksResourceGroup.name])
  .apply(([clusterName, rgName]) => {
    return containerservice.listManagedClusterUserCredentials({
      resourceGroupName: rgName,
      resourceName: clusterName,
    })
  })

const encoded = creds.kubeconfigs[0].value
export const kubeConfig = encoded.apply((enc) =>
  Buffer.from(enc, 'base64').toString(),
)

export const externalIp = egressIp.ipAddress
