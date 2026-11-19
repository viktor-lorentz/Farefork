import { cheapestTier, formatUsd, type MembershipProgram, selectedTier } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { Button, SegmentedControl, Skeleton, Text, Toggle } from '@/design/components';
import { WarningCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { usePreferences } from '@/stores/preferences';
import { useMembershipCatalog } from './useMembershipCatalog';

function MembershipRow({ program, last }: { program: MembershipProgram; last: boolean }) {
  const { colors } = useTheme();
  const membershipIds = usePreferences((state) => state.membershipIds);
  const setMembershipTier = usePreferences((state) => state.setMembershipTier);
  const tier = selectedTier(program, membershipIds);
  const enabled = tier !== null;
  const ref = { id: program.id, tierIds: program.tiers.map((item) => item.id) };
  const primaryProvider = program.providerIds[0];
  const shown = tier ?? cheapestTier(program);
  const price =
    shown === null
      ? 'Not offered'
      : `${tier === null && program.tiers.length > 1 ? 'From ' : ''}${formatUsd(shown.monthlyPriceCents)}/mo${shown.billing === 'annual' ? ', billed yearly' : ''}`;

  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
        !program.available && styles.unavailable,
      ]}
    >
      {primaryProvider ? <ProviderLogo providerId={primaryProvider} size={40} decorative /> : null}
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text variant="labelStrong">{program.name}</Text>
          <Text variant="caption" tone="secondary" tabular>
            {price}
          </Text>
        </View>
        <Text variant="caption" tone="secondary" numberOfLines={3}>
          {program.summary}
        </Text>
        {tier !== null && program.tiers.length > 1 ? (
          <View style={styles.tiers}>
            <SegmentedControl
              accessibilityLabel={`${program.name} billing`}
              options={program.tiers.map((item) => ({ value: item.id, label: item.name }))}
              value={tier.id}
              onChange={(tierId) => {
                setMembershipTier(ref, tierId);
              }}
            />
          </View>
        ) : null}
      </View>
      <Toggle
        value={enabled}
        disabled={!program.available}
        accessibilityLabel={`I have ${program.name}`}
        onValueChange={(value) => {
          setMembershipTier(ref, value ? (program.tiers[0]?.id ?? null) : null);
        }}
      />
    </View>
  );
}

export function MembershipList() {
  const { colors } = useTheme();
  const catalog = useMembershipCatalog();

  if (catalog.isPending) {
    return (
      <View style={styles.list}>
        {[0, 1, 2, 3].map((key) => (
          <View key={key} style={styles.row}>
            <Skeleton width={40} height={40} radius={10} />
            <View style={styles.body}>
              <Skeleton width="40%" height={14} />
              <Skeleton width="85%" height={12} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  if (catalog.isError) {
    return (
      <View style={[styles.error, { backgroundColor: colors.fill }]}>
        <WarningCircleIcon size={24} color={colors.textPrimary} />
        <View style={styles.body}>
          <Text variant="labelStrong">Memberships didn’t load</Text>
          <Text variant="caption" tone="secondary">
            {catalog.error.message}
          </Text>
        </View>
        <Button
          label="Retry"
          size="sm"
          variant="secondary"
          onPress={() => {
            void catalog.refetch();
          }}
        />
      </View>
    );
  }

  const programs = catalog.data.programs;
  return (
    <View style={styles.list}>
      {programs.map((program, index) => (
        <MembershipRow key={program.id} program={program} last={index === programs.length - 1} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    alignSelf: 'stretch',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.md,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: space.xs,
    flexWrap: 'wrap',
  },
  tiers: {
    marginTop: space.xs,
    maxWidth: 260,
  },
  unavailable: {
    opacity: 0.55,
  },
  error: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.md,
    borderRadius: radius.md,
  },
});
