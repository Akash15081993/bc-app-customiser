import { Box, Text, Flex } from "@bigcommerce/big-design";

const DesignDetails = ({ designData }: { designData: any }) => {
  if (!designData) return null;

  const { customizations, screenshots, ProductType } = designData;
  const parts = customizations?.parts || {};

  return (
    <Box marginTop="medium">
      <Text bold>🎨 Design Area</Text>
      <Box marginLeft="medium">
        {Object.entries(parts).map(([partName, partData]: any) => (
          <Box key={partName} marginBottom="small">
            <Text bold>{partName}</Text>
            <Text>Color: {partData.color}</Text>
            {partData.image?.url && (
              <Flex alignItems="center" marginTop="xxSmall">
                <img
                  src={partData.image.url}
                  alt={`${partName} design`}
                  style={{ width: 80, height: 80, border: "1px solid #ddd", borderRadius: 6 }}
                />
                {partData.image.price && (
                  <Text marginLeft="small">Extra Price: ${partData.image.price}</Text>
                )}
              </Flex>
            )}
          </Box>
        ))}
      </Box>

      <Box marginTop="medium">
        <Text bold>🖼️ Screenshots</Text>
        <Flex flexWrap="wrap" marginTop="small">
          {screenshots?.map((s: any, idx: number) => (
            <Box key={idx} marginRight="small" marginBottom="small">
              <Text>{s.angle}</Text>
              <img
                src={s.url}
                alt={s.angle}
                style={{ width: 120, height: 120, border: "1px solid #ddd", borderRadius: 6 }}
              />
            </Box>
          ))}
        </Flex>
      </Box>

      <Box marginTop="medium">
        <Text bold>Product Type:</Text> <Text>{ProductType}</Text>
      </Box>
    </Box>
  );
};

export default DesignDetails;
