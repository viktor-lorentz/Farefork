import createQr from 'qrcode-generator';
import { useMemo } from 'react';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '@/design/theme';

const QUIET_ZONE = 2;

function modulePath(value: string): { d: string; size: number } {
  const code = createQr(0, 'M');
  code.addData(value);
  code.make();
  const count = code.getModuleCount();
  let d = '';
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (code.isDark(row, col)) {
        d += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
  }
  return { d, size: count + QUIET_ZONE * 2 };
}

export function QrCode({ value, size }: { value: string; size: number }) {
  const { colors } = useTheme();
  const { d, size: modules } = useMemo(() => modulePath(value), [value]);
  return (
    <Svg
      width={size}
      height={size}
      viewBox={`0 0 ${modules} ${modules}`}
      accessibilityLabel="QR code to open Farefork on your phone"
    >
      <Path d={`M0 0h${modules}v${modules}h-${modules}z`} fill={colors.logoPlate} />
      <Path d={d} fill={colors.logoPlateDark} />
    </Svg>
  );
}
