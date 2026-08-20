import { StyleSheet, Text, View, Pressable, Dimensions } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { gridTiles } from '../social/gate';
import type { FeedItem } from '../social/api';

const { width } = Dimensions.get('window');
const COLUMNS = 3;
const GUTTER = 6;
const TILE = (width - GUTTER * (COLUMNS + 1)) / COLUMNS;

type Props = {
  feed: FeedItem[] | null;
  onCheckVibe: () => void;
  onBack: () => void;
};

/**
 * The post-to-unlock wall. The grid behind the lock is deliberately unreadable:
 * scores are replaced with a placeholder glyph rather than dimmed, so nothing
 * leaks through before you have posted.
 */
export function LockedFeed({ feed, onCheckVibe, onBack }: Props) {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const tiles = gridTiles(feed, 15);

  return (
    <View style={styles.root}>
      <View style={styles.grid} pointerEvents="none">
        {tiles.map((tile, i) => (
          <View key={i} style={styles.tile}>
            <Text style={styles.tileScore}>{tile ? '••' : ''}</Text>
          </View>
        ))}
      </View>

      <View style={styles.scrim} pointerEvents="none" />

      <View style={styles.center}>
        <View style={styles.lock}>
          <Text style={styles.lockGlyph}>🔒</Text>
        </View>
        <Text style={styles.headline}>
          {feed && feed.length > 0 ? 'Everyone posted.' : 'Nobody has posted yet.'}
        </Text>
        <Text style={styles.sub}>
          {feed && feed.length > 0
            ? 'Post yours to see theirs.'
            : 'Be the first vibe on the feed.'}
        </Text>

        <Pressable
          onPress={onCheckVibe}
          accessibilityRole="button"
          style={({ pressed }) => [styles.pill, pressed && styles.pillPressed]}
        >
          <Text style={styles.pillGlyph}>📷</Text>
          <Text style={styles.pillText}>Check My Vibe</Text>
        </Pressable>

        <Pressable onPress={onBack} hitSlop={12} style={styles.back} accessibilityRole="button">
          <Text style={styles.backText}>Back</Text>
        </Pressable>
      </View>
    </View>
  );
}

function makeStyles(theme: ReturnType<typeof useTheme>['theme']) {
  return StyleSheet.create({
    root: { flex: 1 },
    grid: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: GUTTER,
      gap: GUTTER,
    },
    tile: {
      width: TILE,
      height: TILE * 1.34,
      borderRadius: Math.max(10, theme.radius),
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: 0.5,
    },
    tileScore: { ...theme.display, fontSize: 26, color: theme.textMuted, letterSpacing: 2 },
    scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: `${theme.bg}D9` },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },
    lock: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.cardBorder,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 22,
    },
    lockGlyph: { fontSize: 30 },
    headline: {
      ...theme.display,
      fontSize: 32,
      letterSpacing: -1,
      color: theme.text,
      textAlign: 'center',
    },
    sub: {
      ...theme.body,
      fontSize: 19,
      color: theme.textMuted,
      textAlign: 'center',
      marginTop: 8,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 34,
      paddingVertical: 17,
      paddingHorizontal: 34,
      borderRadius: 999,
      backgroundColor: theme.text,
    },
    pillPressed: { opacity: 0.85 },
    pillGlyph: { fontSize: 19 },
    pillText: { ...theme.label, fontSize: 17, letterSpacing: 0, color: theme.bg },
    back: { marginTop: 22, paddingVertical: 8, paddingHorizontal: 16 },
    backText: { ...theme.label, fontSize: 12, color: theme.textMuted },
  });
}
