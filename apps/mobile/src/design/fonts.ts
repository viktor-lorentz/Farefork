import satoshiBlack from '@assets/fonts/Satoshi-Black.otf';
import satoshiBold from '@assets/fonts/Satoshi-Bold.otf';
import satoshiMedium from '@assets/fonts/Satoshi-Medium.otf';
import satoshiRegular from '@assets/fonts/Satoshi-Regular.otf';
import { fontFamilies } from './tokens/typography';

export const fontAssets = {
  [fontFamilies.regular]: satoshiRegular,
  [fontFamilies.medium]: satoshiMedium,
  [fontFamilies.bold]: satoshiBold,
  [fontFamilies.black]: satoshiBlack,
};
