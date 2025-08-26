import { Box, Flex, Text } from "@bigcommerce/big-design";

const JsonDesignUI = ({ data }: { data: any }) => {
  if (!data) return null;

  const { customizations, screenshots, ProductType } = data;

  const parts = customizations?.parts || {};
  const variants = customizations?.selectedVariants || [];
  const layers = customizations?.selectedLayers || {};

  return (
    <Box style={{marginTop:'20px'}}>
      {/* Header */}
      
      <Flex flexGap={'10px'}>
        <Text color="primary">Product Type:</Text>
        <Text bold>{ProductType?.toUpperCase()}</Text>
      </Flex>

      {customizations?.krCustomizedPrice > 0 && (
        <Flex flexGap={'10px'}>
          <Text color="primary">Design Price:</Text>
          <Text bold>{customizations?.krCustomizedPrice?.toFixed(2)}</Text>
        </Flex>
      )}

      {/* Parts Section */}
      {Object.keys(parts).length > 0 && (
        <Box>
          <Text color="primary">Parts:</Text>
          <Flex flexWrap="wrap">
            {Object.entries(parts).map(([name, val]: any) => (
              <Box
                key={name}
                margin="small"
                padding="small"
                border="box"
                borderRadius="normal"
                style={{ width: '45%' }}
              >
                <Text bold>{name}</Text>
                {val.color && <Text>Color: {val.color}</Text>}
                {val.text && (
                  <Text>
                    Text: ({val.text.content}) - ({val.text.fontFamily}, {val.text.color})
                  </Text>
                )}
                {val.image?.url && (
                  <img
                    src={val.image.url}
                    alt={name}
                    style={{ width: "100%", height: 70, objectFit: "contain", borderRadius: 6 }}
                  />
                )}
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      {/* Variants Section */}
      {variants.length > 0 && (
        <Box marginTop="large">
          <Text color="primary">Variants:</Text>
          <Flex flexWrap="wrap">
            {variants.map((v: any, i: number) => (
              <Box
                key={i}
                margin="small"
                padding="small"
                border="box"
                borderRadius="normal"
                style={{ width: 220 }}
              >
                <Text>{v.name}</Text>
                <Text>${v?.price?.toFixed(2)}</Text>
                {v.image && (
                  <img
                    src={v.image}
                    alt={v.name}
                    style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 6 }}
                  />
                )}
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      {/* Layers Section */}
      {Object.keys(layers).length > 0 && (
        <Box>
          <Text color="primary">Layers:</Text>
          <Flex flexWrap="wrap">
            {Object.entries(layers).map(([key, l]: any) => (
              <Box
                key={key}
                margin="small"
                padding="small"
                border="box"
                borderRadius="normal"
                style={{ width: 220 }}
              >
                <Text>{l.title}</Text>
                <Text>{l?.price?.toFixed(2)}</Text>
                {l.files?.[0] && (
                  <img
                    src={l.files[0]}
                    alt={l.title}
                    style={{ width: "100%", height: 120, objectFit: "contain", borderRadius: 6 }}
                  />
                )}
              </Box>
            ))}
          </Flex>
        </Box>
      )}

      {/* Screenshots Section */}
      {screenshots?.length > 0 && (
        <Box>
          <Text color="primary">Screenshots:</Text>
          <Flex flexWrap="wrap">
            {screenshots.map((s: any, i: number) => (
              <Box key={i} margin="small" style={{ width: '45%' }}> 
                <Text>{s.angle}</Text>
                <img
                  src={s.url}
                  alt={s.angle}
                  style={{ width: '100%', height: 180, border: "1px solid #ddd", borderRadius: 6, objectFit: "contain" }}
                />
              </Box>
            ))}
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default JsonDesignUI;
