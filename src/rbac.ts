import * as azuread from '@pulumi/azuread'
import { prefix } from '../config'

export const adApp = new azuread.Application(`${prefix}-aks-app`, {
  displayName: `${prefix}-aks-app`,
})

const adSp = new azuread.ServicePrincipal(`${prefix}-aks-sp`, {
  applicationId: adApp.applicationId,
})

export const adSpPassword = new azuread.ServicePrincipalPassword(
  `${prefix}-aks-sp`,
  {
    servicePrincipalId: adSp.id,
    rotateWhenChanged: {
      created: '20.10.2021',
    },
  },
)

// resource "azurerm_role_assignment" "main_rg" {
//   scope                = var.main_resource_group
//   role_definition_name = "Contributor"
//   principal_id         = azuread_service_principal.cluster_sp.object_id
// }

// resource "azurerm_role_assignment" "network-contributor" {
//   scope                = azurerm_virtual_network.vnet.id
//   role_definition_name = "Contributor"
//   principal_id         = var.sp_id
// }
