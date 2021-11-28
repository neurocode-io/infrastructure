import * as k8s from '@pulumi/kubernetes'
import * as pulumi from '@pulumi/pulumi'
import { createNginx } from './src/ingress-controller'

const chartVersion = '4.0.6'
const env = pulumi.getStack()
const infra = new pulumi.StackReference(`neurocode/aks/${env}`)

const provider = new k8s.Provider('k8s', {
  kubeconfig: infra.getOutput('kubeConfig'),
})

infra
  .getOutput('externalIp')
  .apply((ip) =>
    createNginx({ provider, loadBalancerIP: ip, version: chartVersion }),
  )
