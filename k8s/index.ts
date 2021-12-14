import * as pulumi from '@pulumi/pulumi'
import { createNamespace, createNginx } from './src/ingress-controller'

const chartVersion = '4.0.13'
const env = pulumi.getStack()
const infra = new pulumi.StackReference(`neurocode/network/${env}`)

const namespace = createNamespace()

const publicIp = infra.getOutput('publicIp') as pulumi.Output<string>

infra.getOutput('vnetRgName').apply((vnetRgName) =>
  createNginx({
    namespace: namespace.metadata.name,
    ipResourceGroup: vnetRgName,
    loadBalancerIP: publicIp,
    version: chartVersion,
  }),
)
