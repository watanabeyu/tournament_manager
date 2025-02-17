import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useEffect, useState } from 'react';
import { getTournamentHistory } from '../../utils/db';

type HistoryItem = {
  id: string;
  type: 'tournament' | 'round-robin';
  date: string;
  participants: number;
  winner: string;
};

export default function HistoryScreen() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const tournaments = await getTournamentHistory();
      const historyItems = tournaments.map(({ tournament, participants, matches }) => {
        const winner = participants.find(p => {
          const wonMatches = matches.filter(m => m.winner_id === p.id);
          return wonMatches.length === participants.length - 1;
        });

        return {
          id: tournament.id,
          type: 'round-robin',
          date: new Date(tournament.created_at * 1000).toISOString().split('T')[0],
          participants: participants.length,
          winner: winner?.name || '不明',
        };
      });

      setHistory(historyItems);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const renderItem = ({ item }: { item: HistoryItem }) => (
    <Link href={`/history/${item.id}`} asChild>
      <TouchableOpacity style={styles.itemContainer}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={item.type === 'tournament' ? 'git-branch-outline' : 'grid-outline'}
            size={24}
            color={item.type === 'tournament' ? '#4F8EF7' : '#FF6B6B'}
          />
        </View>
        <View style={styles.itemContent}>
          <Text style={styles.itemTitle}>
            {item.type === 'tournament' ? 'トーナメント戦' : '総当たり戦'}
          </Text>
          <Text style={styles.itemDate}>{item.date}</Text>
          <View style={styles.itemDetails}>
            <Text style={styles.itemParticipants}>
              参加者: {item.participants}人
            </Text>
            <Text style={styles.itemWinner}>優勝: {item.winner}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
      </TouchableOpacity>
    </Link>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>履歴</Text>
      <FlashList
        data={history}
        renderItem={renderItem}
        estimatedItemSize={100}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    padding: 20,
    color: '#1C1C1E',
  },
  list: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F8FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  itemDate: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  itemDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 12,
  },
  itemParticipants: {
    fontSize: 14,
    color: '#8E8E93',
  },
  itemWinner: {
    fontSize: 14,
    color: '#8E8E93',
  },
});