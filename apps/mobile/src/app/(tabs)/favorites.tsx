import type { FavoriteRow } from '@repo/shared';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import {
  EmptyState,
  IconButton,
  ListRow,
  ListRowIcon,
  PageTitle,
  RowSkeleton,
  Screen,
  SectionHeader,
} from '@/design/components';
import { ForkKnifeIcon, HeartIcon, MapPinIcon, TrashIcon, WarningCircleIcon } from '@/design/icons';
import { controlHeight, space } from '@/design/tokens';
import { useFavorites, useRemoveFavorite } from '@/features/account/queries';
import { currentLocationPlace, locateDevice } from '@/features/rides/location';
import { useDeviceLocation } from '@/stores/location';
import { useSession } from '@/stores/session';
import { useTrip } from '@/stores/trip';

function FavoriteList({ title, rows }: { title: string; rows: FavoriteRow[] }) {
  const router = useRouter();
  const setTrip = useTrip((state) => state.setTrip);
  const addRecent = useTrip((state) => state.addRecent);
  const remove = useRemoveFavorite();

  if (rows.length === 0) {
    return null;
  }

  const open = (row: FavoriteRow) => {
    if (row.kind === 'restaurant') {
      router.push({ pathname: '/food/[id]', params: { id: row.payload.restaurantId } });
      return;
    }
    const { pickup, dropoff } = row.payload;
    if (pickup) {
      setTrip(pickup, dropoff);
      router.navigate('/');
      return;
    }
    void locateDevice({ prompt: false }).then((result) => {
      const point = result.status === 'ok' ? result.point : useDeviceLocation.getState().lastKnown;
      if (point) {
        setTrip(currentLocationPlace(point), dropoff);
        router.navigate('/');
      } else {
        addRecent(dropoff);
        router.push({ pathname: '/rides/search', params: { recent: dropoff.id } });
      }
    });
  };

  return (
    <View>
      <SectionHeader title={title} />
      {rows.map((row, index) => (
        <ListRow
          key={row.id}
          title={row.title}
          subtitle={row.subtitle ?? undefined}
          leading={<ListRowIcon icon={row.kind === 'route' ? MapPinIcon : ForkKnifeIcon} />}
          accessibilityHint={row.kind === 'route' ? 'Compares ride prices' : 'Opens the menu'}
          divider={index < rows.length - 1}
          onPress={() => {
            open(row);
          }}
          trailing={
            <IconButton
              icon={TrashIcon}
              size={controlHeight.sm}
              accessibilityLabel={`Remove ${row.title} from favorites`}
              onPress={() => {
                remove.mutate(row.id);
              }}
            />
          }
        />
      ))}
    </View>
  );
}

function plural(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

function favoritesMeta(routes: number, restaurants: number): string | null {
  const parts = [
    routes > 0 ? plural(routes, 'route') : null,
    restaurants > 0 ? plural(restaurants, 'restaurant') : null,
  ].filter((part) => part !== null);
  return parts.length > 0 ? parts.join(' · ') : null;
}

export default function FavoritesScreen() {
  const router = useRouter();
  const status = useSession((state) => state.status);
  const favorites = useFavorites();
  const rows = favorites.data ?? [];
  const routes = rows.filter((row) => row.kind === 'route');
  const restaurants = rows.filter((row) => row.kind === 'restaurant');

  return (
    <Screen contentStyle={styles.content}>
      <PageTitle title="Favorites" meta={favoritesMeta(routes.length, restaurants.length)} />
      {status === 'unavailable' ? (
        <EmptyState
          icon={HeartIcon}
          title="Saving is off in this build"
          body="You can still compare prices. Favorites come back when accounts are switched on."
        />
      ) : status === 'loading' || (status === 'signedIn' && favorites.isPending) ? (
        <RowSkeleton count={2} />
      ) : status === 'signedOut' ? (
        <EmptyState
          icon={HeartIcon}
          title="Sign in to save favorites"
          body="Saved routes and restaurants sync to every device you sign in on."
          action={{
            label: 'Sign in',
            onPress: () => {
              router.push('/account/sign-in');
            },
          }}
        />
      ) : favorites.isError ? (
        <EmptyState
          icon={WarningCircleIcon}
          title="Favorites didn’t load"
          body={favorites.error.message}
          action={{
            label: 'Try again',
            onPress: () => {
              void favorites.refetch();
            },
          }}
        />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={HeartIcon}
          title="Nothing saved"
          body="Tap the heart on a route or restaurant to save it here."
          action={{
            label: 'Compare a ride',
            onPress: () => {
              router.push('/rides/search');
            },
          }}
        />
      ) : (
        <>
          <FavoriteList title="Routes" rows={routes} />
          <FavoriteList title="Restaurants" rows={restaurants} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space.lg },
});
