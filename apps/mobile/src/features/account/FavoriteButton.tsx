import type { NewFavorite } from '@repo/shared';
import { useRouter } from 'expo-router';
import { IconButton } from '@/design/components';
import { HeartIcon } from '@/design/icons';
import { haptics } from '@/lib/haptics';
import { useSession } from '@/stores/session';
import { useAddFavorite, useFavorite, useRemoveFavorite } from './queries';

export function FavoriteButton({ favorite, size = 44 }: { favorite: NewFavorite; size?: 36 | 44 }) {
  const router = useRouter();
  const status = useSession((state) => state.status);
  const { favorite: saved } = useFavorite(favorite.kind, favorite.key);
  const add = useAddFavorite();
  const remove = useRemoveFavorite();

  if (status === 'unavailable' || status === 'loading') {
    return null;
  }

  const active = saved !== undefined || add.isPending;
  const label = favorite.kind === 'route' ? 'route' : 'restaurant';

  return (
    <IconButton
      icon={HeartIcon}
      size={size}
      active={active}
      disabled={remove.isPending}
      accessibilityLabel={active ? `Remove ${label} from favorites` : `Save ${label} to favorites`}
      onPress={() => {
        if (status !== 'signedIn') {
          router.push('/account/sign-in');
          return;
        }
        if (saved) {
          remove.mutate(saved.id);
        } else {
          haptics.success();
          add.mutate(favorite);
        }
      }}
    />
  );
}
