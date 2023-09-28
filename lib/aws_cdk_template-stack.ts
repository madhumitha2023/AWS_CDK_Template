import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as iam from 'aws-cdk-lib/aws-iam';

export class AwsCdkTemplateStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    // example resource
    const queue = new sqs.Queue(this, 'AwsCdkTemplateQueue', {
      visibilityTimeout: cdk.Duration.seconds(300)
    });
    
    // Create a VPC
    const vpc = new ec2.Vpc(this, 'myvpc', {
      cidr: '10.30.0.0/16',
    });

    // Create an EC2 instance in a public subnet
    const ec2Instance = new ec2.Instance(this, 'EC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T2, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux({ generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2 }),
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    
    // Create an SNS Topic
    const topic = new sns.Topic(this, 'myTopic');

    // Create AWS Secrets Manager secret with key-value pairs
    const secret = new secretsmanager.Secret(this, 'mySecret', {
      secretName: 'metrodb-secrets',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'username', password: 'password' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
      },
    });

    // Grant permissions to the EC2 instance to access the secret
    secret.grantRead(ec2Instance.role);
    
    // Output the EC2 instance's public IP address
    new cdk.CfnOutput(this, 'InstancePublicIp', {
      value: ec2Instance.instancePublicIp,
    });
  }
}
