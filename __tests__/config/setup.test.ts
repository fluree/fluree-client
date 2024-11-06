import { GenericContainer } from 'testcontainers';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

interface FlureeConfig {
  images: Array<{
    tag: string;
    description: string;
  }>;
  defaultImage: string;
  containerPort: number;
  hostPort: number;
}

const configPath = path.join(__dirname, 'fluree-images.json');
const flureeConfig: FlureeConfig = JSON.parse(
  fs.readFileSync(configPath, 'utf8'),
);

/**
 * Get the Fluree image to test against
 * @returns The image tag to use
 */
function getFlureeImage(): string {
  // Allow override via environment variable
  const envImage = process.env.FLUREE_TEST_IMAGE;
  if (envImage) {
    // Verify the image exists in our config
    if (!flureeConfig.images.some((img) => img.tag === envImage)) {
      console.warn(
        `Warning: Image ${envImage} not found in fluree-images.json`,
      );
    }
    return envImage;
  }
  return flureeConfig.defaultImage;
}

/**
 * Creates a new Fluree container for use with tests
 * @returns A new Fluree container
 */
async function generateFlureeContainer(): Promise<GenericContainer> {
  const imageTag = getFlureeImage();
  console.log(`Using Fluree image: fluree/server:${imageTag}`);

  const container = await new GenericContainer(`fluree/server:${imageTag}`)
    .withExposedPorts(flureeConfig.containerPort)
    .withReuse();
  return container;
}

module.exports = async () => {
  dotenv.config({ path: '.env.local' });
  const container = await generateFlureeContainer();
  const testContainer = await container.start();
  process.env.FLUREE_CLIENT_TEST_HOST = testContainer.getHost();
  process.env.FLUREE_CLIENT_TEST_PORT = testContainer
    .getMappedPort(flureeConfig.containerPort)
    .toString();
  process.env.CONTAINER_NAME = testContainer.getName();
  process.env.TEST_PRIVATE_KEY =
    'fef21a1f4b65618ed2e8f5b2f37a2d6a0c4f0f816e656910253e81b1078fffd6';
  process.env.TEST_DID = 'did:fluree:TeznBH6UYJGux54BcS8F2wTbyPACdki3p6s';
};
