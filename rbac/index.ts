import * as pulumi from '@pulumi/pulumi'
import * as azure from '@pulumi/azure-native'

const env = pulumi.getStack()
const aks = new pulumi.StackReference(`neurocode/aks/${env}`)
const network = new pulumi.StackReference(`neurocode/network/${env}`)

const publicIp = network.getOutput('egressIp') as pulumi.Output<
  azure.network.PublicIPAddress
>
const principalId = aks.getOutput('principalId')

export const networkContributor = azure.authorization.getClientConfig().then(
  (config) =>
    new azure.authorization.RoleAssignment('networkContributor', {
      principalId,
      principalType: 'ServicePrincipal',
      roleDefinitionId:
        // https://docs.microsoft.com/en-us/azure/role-based-access-control/built-in-roles#network-contributor+
        `/subscriptions/${config.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/4d97b98b-1d4f-4787-a291-c67834d212e7`,

      scope: publicIp.id,
    }),
)
