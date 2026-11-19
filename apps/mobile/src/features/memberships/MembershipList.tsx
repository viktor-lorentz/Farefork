import type { MembershipProgram } from '@repo/shared';
import { formatUsd } from '@repo/shared';
import { StyleSheet, View } from 'react-native';
import { Button, Skeleton, Text, Toggle } from '@/design/components';
import { WarningCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { ProviderLogo } from '@/features/providers/ProviderLogo';
import { usePreferences } from '@/stores/preferences';
import { useMembershipCatalog } from './useMembershipCatalog';

function MembershipRow({ program, last }: { program: MembershipProgram; last: boolean }) {
  const { colors } = useTheme();
  const enabled = usePreferences((state) => state.membershipIds.includes(program.id));
  const setMembership = usePreferences((state) => state.setMembership);
  const primaryProvider = program.providerIds[0];
  const price =
    program.monthlyPriceCents !== null
      ? `${formatUsd(program.monthlyPriceCents)}/mo`
      : 'Not offered';

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
      </View>
      <Toggle
        value={enabled}
        disabled={!program.available}
        accessibilityLabel={`I have ${program.name}`}
        onValueChange={(value) => {
          setMembership(program.id, value);
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
