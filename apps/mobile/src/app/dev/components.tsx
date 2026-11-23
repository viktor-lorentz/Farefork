import { providerIds, type ProviderId } from '@repo/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Badge,
  Button,
  Chip,
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  QuoteCard,
  QuoteCardSkeleton,
  QuoteCardUnavailable,
  Screen,
  ScreenHeader,
  SearchField,
  SectionHeader,
  SegmentedControl,
  Skeleton,
  Text,
  Toggle,
} from '@/design/components';
import {
  ArrowSquareOutIcon,
  BellIcon,
  CarIcon,
  ClockIcon,
  ForkKnifeIcon,
  HeartIcon,
  LightningIcon,
  MagnifyingGlassIcon,
  PercentIcon,
  SealCheckIcon,
  StarIcon,
  UsersIcon,
} from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space, typeScale, type TypeVariant } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';

const typeVariants = Object.keys(typeScale) as TypeVariant[];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      {children}
    </View>
  );
}

function Swatch({ name, color }: { name: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.swatch}>
      <View style={[styles.swatchChip, { backgroundColor: color, borderColor: colors.border }]} />
      <Text variant="caption">{name}</Text>
      <Text variant="caption" tone="tertiary" tabular>
        {color}
      </Text>
    </View>
  );
}

export default function ComponentGallery() {
  const { colors } = useTheme();
  const [toggle, setToggle] = useState(true);
  const [chips, setChips] = useState<string[]>(['comfort']);
  const [segment, setSegment] = useState<'rides' | 'food'>('rides');
  const [selectedQuote, setSelectedQuote] = useState<ProviderId>('waymo');

  const toggleChip = (id: string) => {
    setChips((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Components" large />
      <Screen padTop={false} padBottom>
        <Section title="Color">
          <View style={styles.wrap}>
            {(
              [
                'background',
                'surface',
                'fill',
                'border',
                'textPrimary',
                'textSecondary',
                'accent',
                'danger',
              ] as const
            ).map((key) => (
              <Swatch key={key} name={key} color={colors[key]} />
            ))}
          </View>
        </Section>

        <Section title="Type">
          {typeVariants.map((variant) => (
            <Text key={variant} variant={variant} numberOfLines={1}>
              {variant.startsWith('price') ? '$1,284.07' : variant}
            </Text>
          ))}
        </Section>

        <Section title="Provider logos">
          <View style={styles.wrap}>
            {providerIds.map((id) => (
              <ProviderLogo key={id} providerId={id} size={48} />
            ))}
          </View>
          <View style={styles.wrap}>
            {providerIds.map((id) => (
              <ProviderLogo key={id} providerId={id} size={24} />
            ))}
          </View>
        </Section>

        <Section title="Buttons">
          <View style={styles.stack}>
            <Button label="Book with Waymo" trailingIcon={ArrowSquareOutIcon} fullWidth />
            <Button label="Claim deal" variant="accent" leadingIcon={PercentIcon} fullWidth />
            <View style={styles.wrap}>
              <Button label="Secondary" variant="secondary" size="md" />
              <Button label="Tertiary" variant="tertiary" size="md" />
              <Button label="Remove" variant="danger" size="md" />
              <Button label="Loading" size="md" loading />
              <Button label="Disabled" size="md" disabled />
              <Button label="Small" size="sm" variant="secondary" />
            </View>
            <View style={styles.wrap}>
              <IconButton icon={HeartIcon} accessibilityLabel="Favorite" />
              <IconButton icon={BellIcon} accessibilityLabel="Alerts" variant="filled" />
              <IconButton icon={StarIcon} accessibilityLabel="Rate" variant="raised" />
              <IconButton
                icon={StarIcon}
                accessibilityLabel="Rate small"
                variant="filled"
                size={36}
              />
            </View>
          </View>
        </Section>

        <Section title="Quote cards">
          <View style={styles.quoteList}>
            <QuoteCard
              logo={<ProviderLogo providerId="waymo" decorative />}
              title="Waymo"
              meta="4 min"
              detail="Arrives 6:42 PM · Fully autonomous"
              priceCents={1840}
              bestPrice
              selected={selectedQuote === 'waymo'}
              onPress={() => {
                setSelectedQuote('waymo');
              }}
            />
            <QuoteCard
              logo={<ProviderLogo providerId="uber" decorative />}
              title="UberX"
              meta="3 min"
              detail="Arrives 6:41 PM"
              priceCents={2115}
              originalPriceCents={2350}
              note={{ icon: SealCheckIcon, text: 'Uber One saves 10%' }}
              selected={selectedQuote === 'uber'}
              onPress={() => {
                setSelectedQuote('uber');
              }}
            />
            <QuoteCard
              logo={<ProviderLogo providerId="lyft" decorative />}
              title="Lyft XL"
              meta="7 min"
              detail="Up to 6 riders"
              priceCents={3460}
              surgeLabel="1.4× busy"
              note={{ icon: UsersIcon, text: '6 seats' }}
              selected={selectedQuote === 'lyft'}
              onPress={() => {
                setSelectedQuote('lyft');
              }}
            />
            <QuoteCardSkeleton />
            <QuoteCardUnavailable
              logo={<ProviderLogo providerId="waymo" decorative />}
              title="Waymo"
              reason="This trip is outside the Waymo service area."
            />
          </View>
        </Section>

        <Section title="List rows">
          <View style={[styles.card, { borderColor: colors.border }]}>
            <ListRow
              title="Ride history"
              subtitle="12 trips this month"
              leading={<ListRowIcon icon={ClockIcon} />}
              chevron
              onPress={() => undefined}
              divider
            />
            <ListRow
              title="Price alerts"
              leading={<ListRowIcon icon={LightningIcon} />}
              trailing={
                <Toggle
                  value={toggle}
                  onValueChange={setToggle}
                  accessibilityLabel="Price alerts"
                />
              }
              divider
            />
            <ListRow title="Plan" value="Free" onPress={() => undefined} chevron divider />
            <ListRow title="Sign out" destructive onPress={() => undefined} />
          </View>
        </Section>

        <Section title="Controls">
          <View style={styles.stack}>
            <SegmentedControl
              options={[
                { value: 'rides', label: 'Rides', icon: CarIcon },
                { value: 'food', label: 'Food', icon: ForkKnifeIcon },
              ]}
              value={segment}
              onChange={setSegment}
              accessibilityLabel="Vertical"
            />
            <View style={styles.wrap}>
              {[
                { id: 'economy', label: 'Economy' },
                { id: 'comfort', label: 'Comfort' },
                { id: 'xl', label: 'XL', count: 3 },
                { id: 'premium', label: 'Premium' },
              ].map((chip) => (
                <Chip
                  key={chip.id}
                  label={chip.label}
                  count={chip.count}
                  selected={chips.includes(chip.id)}
                  onPress={() => {
                    toggleChip(chip.id);
                  }}
                />
              ))}
            </View>
            <SearchField placeholder="Search restaurants" icon={MagnifyingGlassIcon} />
            <View style={styles.wrap}>
              <Badge label="Best price" tone="accent" />
              <Badge label="Member" tone="inverse" icon={SealCheckIcon} />
              <Badge label="New" tone="neutral" />
              <Badge label="Soon" tone="outline" />
              <Badge label="1.3× busy" tone="danger" icon={LightningIcon} />
            </View>
          </View>
        </Section>

        <Section title="Loading">
          <View style={styles.stack}>
            <Skeleton height={20} width="60%" />
            <Skeleton height={56} radius={radius.md} />
          </View>
        </Section>

        <Section title="Empty state">
          <EmptyState
            icon={HeartIcon}
            title="Nothing saved"
            body="Tap the heart on any route or restaurant to keep it here."
            action={{ label: 'Compare a ride', onPress: () => undefined }}
          />
        </Section>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  section: {
    gap: space.sm,
    marginBottom: space.xxl,
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.xs,
    alignItems: 'center',
  },
  stack: {
    gap: space.md,
  },
  quoteList: {
    gap: space.xxs,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  swatch: {
    width: 104,
    gap: 2,
  },
  swatchChip: {
    height: 48,
    borderRadius: radius.sm,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: space.xxs,
  },
});
