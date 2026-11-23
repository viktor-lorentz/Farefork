import { StyleSheet, View } from 'react-native';
import { QuoteCard } from '@/design/components';
import { SealCheckIcon, TimerIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';

function Stage({ children }: { children: React.ReactNode }) {
  const { colors, elevation } = useTheme();
  return (
    <View
      importantForAccessibility="no-hide-descendants"
      accessibilityElementsHidden
      style={[styles.stage, { backgroundColor: colors.surfaceRaised, boxShadow: elevation.raised }]}
      pointerEvents="none"
    >
      {children}
    </View>
  );
}

export function CompareIllustration() {
  return (
    <Stage>
      <QuoteCard
        logo={<ProviderLogo providerId="waymo" decorative />}
        title="Waymo"
        meta="4 min"
        detail="Arrives 6:42 PM"
        priceCents={1840}
        bestPrice
      />
      <QuoteCard
        logo={<ProviderLogo providerId="uber" decorative />}
        title="UberX"
        meta="3 min"
        detail="Arrives 6:41 PM"
        priceCents={2115}
      />
      <QuoteCard
        logo={<ProviderLogo providerId="lyft" decorative />}
        title="Lyft"
        meta="5 min"
        detail="Arrives 6:44 PM"
        priceCents={2290}
        surgeLabel="1.3× busy"
      />
    </Stage>
  );
}

export function TotalsIllustration() {
  return (
    <Stage>
      <QuoteCard
        logo={<ProviderLogo providerId="grubhub" decorative />}
        title="Grubhub"
        detail="Fees, tip and tax included"
        priceCents={3187}
        bestPrice
      />
      <QuoteCard
        logo={<ProviderLogo providerId="doordash" decorative />}
        title="DoorDash"
        detail="Fees, tip and tax included"
        priceCents={3392}
      />
      <QuoteCard
        logo={<ProviderLogo providerId="ubereats" decorative />}
        title="Uber Eats"
        detail="Fees, tip and tax included"
        priceCents={3540}
        note={{ icon: TimerIcon, text: '25–35 min' }}
      />
    </Stage>
  );
}

export function MembershipIllustration() {
  return (
    <Stage>
      <QuoteCard
        logo={<ProviderLogo providerId="ubereats" decorative />}
        title="Uber Eats"
        detail="Delivery fee waived"
        priceCents={2899}
        originalPriceCents={3540}
        note={{ icon: SealCheckIcon, text: 'Uber One applied' }}
        bestPrice
      />
      <QuoteCard
        logo={<ProviderLogo providerId="doordash" decorative />}
        title="DoorDash"
        detail="Fees, tip and tax included"
        priceCents={3392}
      />
    </Stage>
  );
}

const styles = StyleSheet.create({
  stage: {
    alignSelf: 'stretch',
    padding: space.xs,
    borderRadius: radius.xl,
    gap: space.xxs,
  },
});
