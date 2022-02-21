import * as azure from '@pulumi/azure'
import * as cfg from '../config'

const rg = new azure.core.ResourceGroup(`${cfg.shortLocation}-rg-cosmosdb`, {
  location: cfg.location,
})

export const cosmosAccount = new azure.cosmosdb.Account(
  `${cfg.shortLocation}-cosmosdb`,
  {
    name: `${cfg.shortLocation}-cosmosdb`,
    location: rg.location,
    resourceGroupName: rg.name,
    offerType: 'Standard',
    kind: 'GlobalDocumentDB',
    enableAutomaticFailover: false,
    consistencyPolicy: {
      consistencyLevel: 'BoundedStaleness',
      maxIntervalInSeconds: 300,
      maxStalenessPrefix: 100000,
    },
    geoLocations: [
      {
        location: cfg.location,
        failoverPriority: 0,
      },
    ],
    capabilities: [{ name: 'EnableServerless' }],
  },
)
