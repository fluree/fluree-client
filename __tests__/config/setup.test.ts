import { GenericContainer } from 'testcontainers';

async function generateFlureeContainer(): Promise<GenericContainer> {
  const container = await new GenericContainer('fluree/server:latest')
    .withExposedPorts(8090)
    .withReuse();
  return container;
}

module.exports = async () => {
  const container = await generateFlureeContainer();
  const testContainer = await container.start();
  process.env.FLUREE_CLIENT_TEST_HOST = testContainer.getHost();
  process.env.FLUREE_CLIENT_TEST_PORT = testContainer
    .getMappedPort(8090)
    .toString();
  process.env.CONTAINER_NAME = testContainer.getName();
};
