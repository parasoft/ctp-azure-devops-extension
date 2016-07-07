#Parasoft Service Virtualization
This extension contains build tasks for deploying and destroying virtual environments.

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