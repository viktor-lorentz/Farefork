import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  EmptyState,
  ListRow,
  ListRowIcon,
  Screen,
  ScreenHeader,
  SearchField,
} from '@/design/components';
import { MapPinIcon, NavigationArrowIcon } from '@/design/icons';
import { useTheme } from '@/design/theme';
import { space } from '@/design/tokens';

const suggestions = [
  { id: 'sfo', title: 'San Francisco International Airport', subtitle: 'SFO, San Francisco' },
  { id: 'ferry', title: 'Ferry Building', subtitle: '1 Ferry Building, San Francisco' },
  { id: 'mission', title: 'Mission Dolores Park', subtitle: 'Dolores St & 19th St, San Francisco' },
  { id: 'chase', title: 'Chase Center', subtitle: '1 Warriors Way, San Francisco' },
];

export default function RideSearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [destination, setDestination] = useState('');
  const query = destination.trim().toLowerCase();
  const results = suggestions.filter((item) =>
    query.length === 0 ? true : `${item.title} ${item.subtitle}`.toLowerCase().includes(query),
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title="Plan your ride" />
      <Screen padTop={false} contentStyle={styles.content}>
        <View style={styles.fields}>
          <SearchField
            icon={NavigationArrowIcon}
            value="Current location"
            editable={false}
            size="md"
            accessibilityLabel="Pickup, current location"
          />
          <SearchField
            icon={MapPinIcon}
            value={destination}
            onChangeText={setDestination}
            placeholder="Where to?"
            autoFocus
            size="md"
            returnKeyType="search"
            accessibilityLabel="Destination"
          />
        </View>
        {results.length > 0 ? (
          <View>
            {results.map((item, index) => (
              <ListRow
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                leading={<ListRowIcon icon={MapPinIcon} />}
                divider={index < results.length - 1}
                accessibilityHint="Ride comparison arrives in milestone 2"
                onPress={() => {
                  router.back();
                }}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            icon={MapPinIcon}
            title="No matches"
            body="Live address search arrives with ride comparison in milestone 2."
          />
        )}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  content: {
    gap: space.lg,
  },
  fields: {
    gap: space.xs,
  },
});
