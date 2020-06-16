# Parasoft Service Virtualization
Service Virtualization provides a complete test environment for complex, distributed systems.  From the perspective of the application under test (AUT), it simulates the behavior of dependent components--creating an “always-on” test environment allowing DevTest teams to test earlier, faster and more completely.  It is often used when "dependent components" connected to the AUT (e.g., APIs, 3rd-party services, databases, applications, and other endpoints), but not readily available for development and test.

## About the Parasoft Service Virtualization Extension
This extension contains a build task for deploying a complete, simulated test environment and another task for destroying the environment.   There is no need to share test environments or resources across teams or test phases; the exact environment you need is instantly spun up whenever you want it, then destroyed as soon as you’re done with it.  Both deploy and destroy tasks can be integrated at any point in the Azure DevOps pipeline

## Getting Started and Resources
For getting started guides and other resources for service virtualization for Microsoft, please see [Deploying Virtualize to Cloud-based Microsoft Environments](https://docs.parasoft.com/display/GUIDES/Deploying+Virtualize+to+Cloud-based+Microsoft+Environments).

## Prerequisites
Parasoft Service Virtualization artifacts must be provisioned in Azure Resource Manager in order to use the Visual Studio tasks.

## How to use
The extension adds the following build tasks to Visual Studio Team Services:
* Parasoft Service Virtualization Deploy
  Provision a pre-defined environment to a specific state (instance).
  Optionally deploy a copy of the environment either to the same service virtualization server or another one. 
* Parasoft Service Virtualization Destroy
  Remove a service virtualization environment and clean up all related artifacts.  This step is useful in conjunction with the copy environment option in the deploy step.
  
## Documentation
You can find detailed documentation on how to create service virtualization environments by installing the Parasoft Service Virtualization artifact in Azure and opening a browser to the host name / ip address to see the online user guide.