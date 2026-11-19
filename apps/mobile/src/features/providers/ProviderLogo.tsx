import { providerName, type ProviderId } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/design/theme';
import { logoMarks } from './logoMarks';

export type ProviderLogoSize = 24 | 32 | 40 | 48;

export type ProviderLogoProps = {
  providerId: ProviderId;
  size?: ProviderLogoSize;
  decorative?: boolean;
};

export function ProviderLogo({ providerId, size = 40, decorative = false }: ProviderLogoProps) {
  const { colors, scheme } = useTheme();
  const mark = logoMarks[providerId];
  const [minX, minY, width, height] = mark.viewBox;
  const maxWidth = size * (width / height > 3.2 ? 0.84 : 0.74);
  const maxHeight = size * 0.6;
  const scale = Math.min(maxWidth / width, maxHeight / height);
  const darkPlate = mark.plate === 'dark';

  return (
    <View
      accessible={!decorative}
      accessibilityRole={decorative ? undefined : 'image'}
      accessibilityLabel={decorative ? undefined : providerName(providerId)}
      importantForAccessibility={decorative ? 'no-hide-descendants' : 'auto'}
      style={[
        styles.plate,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.24),
          backgroundColor: darkPlate ? '#000000' : colors.logoPlate,
          borderColor: darkPlate && scheme === 'dark' ? '#2A2A2A' : colors.logoPlateBorder,
        },
      ]}
    >
      <Svg
        width={width * scale}
        height={height * scale}
        viewBox={`${minX} ${minY} ${width} ${height}`}
      >
        {mark.paths.map((path) => (
          <Path key={path.fill + path.d.slice(0, 12)} d={path.d} fill={path.fill} />
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  plate: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
});
