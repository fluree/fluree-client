import { GenericContainer } from 'testcontainers';
import dotenv from 'dotenv';

/**
 *
 * @returns a new fluree container for use with tests
 */
async function generateFlureeContainer(): Promise<GenericContainer> {
  const container = await new GenericContainer('fluree/server:latest')
    .withExposedPorts(8090)
    .withReuse();
  return container;
}

module.exports = async () => {
  dotenv.config({ path: '.env.local' });
  const container = await generateFlureeContainer();
  const testContainer = await container.start();
  process.env.FLUREE_CLIENT_TEST_HOST = testContainer.getHost();
  process.env.FLUREE_CLIENT_TEST_PORT = testContainer
    .getMappedPort(8090)
    .toString();
  process.env.CONTAINER_NAME = testContainer.getName();
  process.env.TEST_PRIVATE_KEY =
    'fef21a1f4b65618ed2e8f5b2f37a2d6a0c4f0f816e656910253e81b1078fffd6';
  process.env.TEST_DID = 'did:fluree:TeznBH6UYJGux54BcS8F2wTbyPACdki3p6s';
};
