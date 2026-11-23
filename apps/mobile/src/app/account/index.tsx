import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  Button,
  ListRow,
  ListRowIcon,
  Screen,
  ScreenHeader,
  SectionHeader,
  Text,
} from '@/design/components';
import { ReceiptIcon, SignOutIcon, TrashIcon, UserCircleIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { radius, space } from '@/design/tokens';
import { deleteAccount, signOut } from '@/features/account/auth';
import { useSavingsSummary } from '@/features/account/queries';
import { SavingsCard } from '@/features/account/SavingsCard';
import { useSession } from '@/stores/session';

export default function AccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const email = useSession((state) => state.email);
  const status = useSession((state) => state.status);
  const summary = useSavingsSummary();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (status !== 'signedIn') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ScreenHeader title="Account" large />
        <Screen padTop={false} contentStyle={styles.content}>
          <Text variant="body" tone="secondary">
            You’re signed out.
          </Text>
          <Button
            label="Sign in"
            fullWidth
            onPress={() => {
              router.replace('/account/sign-in');
            }}
          />
        </Screen>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Account" large />
      <Screen padTop={false} contentStyle={styles.content}>
        <ListRow
          flush
          title={email ?? 'Signed in'}
          subtitle="Signed in with an email code"
          leading={<ListRowIcon icon={UserCircleIcon} />}
        />
        <SavingsCard summary={summary.isError ? undefined : summary.data} />
        {summary.isError ? (
          <Text variant="caption" tone="secondary">
            {summary.error.message}
          </Text>
        ) : null}
        <View
          style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <ListRow
            title="History"
            subtitle="Rides and orders you booked through Farefork"
            leading={<ListRowIcon icon={ReceiptIcon} />}
            chevron
            divider
            onPress={() => {
              router.push('/account/history');
            }}
          />
          <ListRow
            title="Sign out"
            leading={<ListRowIcon icon={SignOutIcon} />}
            onPress={() => {
              void signOut().then(() => {
                router.back();
              });
            }}
          />
        </View>

        <SectionHeader title="Delete account" style={styles.section} />
        <Text variant="caption" tone="secondary">
          Permanently deletes your account, favorites and history. This can’t be undone.
        </Text>
        {deleteError !== null ? (
          <Text variant="caption" tone="secondary">
            {deleteError}
          </Text>
        ) : null}
        {confirmDelete ? (
          <View style={styles.confirm}>
            <Button
              label="Delete everything"
              variant="danger"
              leadingIcon={TrashIcon}
              loading={deleting}
              fullWidth
              onPress={() => {
                setDeleting(true);
                setDeleteError(null);
                void deleteAccount().then((result) => {
                  setDeleting(false);
                  if (result.ok) {
                    router.replace('/');
                  } else {
                    setDeleteError(result.message);
                  }
                });
              }}
            />
            <Button
              label="Keep my account"
              variant="secondary"
              fullWidth
              disabled={deleting}
              onPress={() => {
                setConfirmDelete(false);
              }}
            />
          </View>
        ) : (
          <Button
            label="Delete account"
            variant="secondary"
            leadingIcon={TrashIcon}
            onPress={() => {
              setConfirmDelete(true);
            }}
          />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { gap: space.md },
  section: { marginTop: space.md },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  confirm: { gap: space.xs },
});
