import { MaterialSymbols_400Regular_Filled } from '@expo-google-fonts/material-symbols/400Regular_Filled';
import mediumWeight from 'expo-symbols/androidWeights/medium';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { ColorValue, StyleProp, ViewStyle } from 'react-native';

export type IconWeight = 'regular' | 'bold' | 'fill';

export type IconProps = {
  size?: number;
  color?: ColorValue;
  weight?: IconWeight;
  style?: StyleProp<ViewStyle>;
};

export type Icon = (props: IconProps) => React.JSX.Element;

const filledWeight = {
  ios: 'regular',
  android: { name: 'MaterialSymbols_400Regular_Filled', font: MaterialSymbols_400Regular_Filled },
} as const;

const boldWeight = {
  ios: 'semibold',
  android: mediumWeight,
} as const;

function symbol(sf: SFSymbol, md: AndroidSymbol, sfFilled?: SFSymbol): Icon {
  return function SymbolIcon({ size = 24, color, weight = 'regular', style }: IconProps) {
    const filled = weight === 'fill';
    return (
      <SymbolView
        name={{ ios: filled && sfFilled ? sfFilled : sf, android: md, web: md }}
        size={size}
        tintColor={color}
        weight={filled ? filledWeight : weight === 'bold' ? boldWeight : undefined}
        style={style}
      />
    );
  };
}

export const ArrowLeftIcon = symbol('arrow.left', 'arrow_back');
export const ArrowSquareOutIcon = symbol('arrow.up.right.square', 'open_in_new');
export const ArrowsClockwiseIcon = symbol('arrow.clockwise', 'refresh');
export const ArrowsDownUpIcon = symbol('arrow.up.arrow.down', 'swap_vert');
export const BellIcon = symbol('bell', 'notifications', 'bell.fill');
export const BellRingingIcon = symbol('bell.badge', 'notifications_active', 'bell.badge.fill');
export const BriefcaseIcon = symbol('briefcase', 'work', 'briefcase.fill');
export const CarIcon = symbol('car', 'directions_car', 'car.fill');
export const CaretLeftIcon = symbol('chevron.left', 'chevron_left');
export const CaretRightIcon = symbol('chevron.right', 'chevron_right');
export const CheckIcon = symbol('checkmark', 'check');
export const ClockCounterClockwiseIcon = symbol('clock.arrow.circlepath', 'history');
export const ClockIcon = symbol('clock', 'schedule', 'clock.fill');
export const CodeIcon = symbol('chevron.left.forwardslash.chevron.right', 'code');
export const CircleIcon = symbol('circle', 'radio_button_unchecked', 'circle.fill');
export const CrosshairIcon = symbol('location', 'my_location', 'location.fill');
export const ForkKnifeIcon = symbol('fork.knife', 'restaurant');
export const HeartIcon = symbol('heart', 'favorite', 'heart.fill');
export const HouseIcon = symbol('house', 'home', 'house.fill');
export const InfoIcon = symbol('info.circle', 'info', 'info.circle.fill');
export const LightningIcon = symbol('bolt', 'bolt', 'bolt.fill');
export const MagnifyingGlassIcon = symbol('magnifyingglass', 'search');
export const MapPinIcon = symbol('mappin.and.ellipse', 'location_on');
export const MinusIcon = symbol('minus', 'remove');
export const MonitorIcon = symbol('display', 'desktop_windows');
export const MoonIcon = symbol('moon', 'dark_mode', 'moon.fill');
export const MopedIcon = symbol('scooter', 'moped');
export const NavigationArrowIcon = symbol('location.north', 'navigation', 'location.north.fill');
export const PercentIcon = symbol('percent', 'percent');
export const PlusIcon = symbol('plus', 'add');
export const ReceiptIcon = symbol('receipt', 'receipt_long', 'receipt.fill');
export const SealCheckIcon = symbol('checkmark.seal', 'verified', 'checkmark.seal.fill');
export const ShoppingBagIcon = symbol('bag', 'shopping_bag', 'bag.fill');
export const SquareIcon = symbol('square', 'check_box_outline_blank', 'square.fill');
export const StarIcon = symbol('star', 'star', 'star.fill');
export const StorefrontIcon = symbol('storefront', 'storefront', 'storefront.fill');
export const SunIcon = symbol('sun.max', 'light_mode', 'sun.max.fill');
export const SteeringWheelIcon = symbol('steeringwheel', 'auto_transmission');
export const TagIcon = symbol('tag', 'sell', 'tag.fill');
export const TimerIcon = symbol('timer', 'timer');
export const UserIcon = symbol('person', 'person', 'person.fill');
export const UsersIcon = symbol('person.2', 'group', 'person.2.fill');
export const WarningCircleIcon = symbol('exclamationmark.circle', 'error', 'exclamationmark.circle.fill');
export const EnvelopeIcon = symbol('envelope', 'mail', 'envelope.fill');
export const PiggyBankIcon = symbol('banknote', 'savings', 'banknote.fill');
export const SignOutIcon = symbol('rectangle.portrait.and.arrow.right', 'logout');
export const TrashIcon = symbol('trash', 'delete', 'trash.fill');
export const UserCircleIcon = symbol('person.crop.circle', 'account_circle', 'person.crop.circle.fill');
export const XIcon = symbol('xmark', 'close');
export const XCircleIcon = symbol('xmark.circle.fill', 'cancel');
export const LocationFillIcon = symbol('location.fill', 'near_me');
export const QrIcon = symbol('qrcode', 'qr_code_2');
export const PhoneIcon = symbol('iphone', 'smartphone');
