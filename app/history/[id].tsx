import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { getTournamentHistory } from '../../utils/db';
import type { Tournament, Participant, Match } from '../../utils/db';

export default function TournamentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    loadTournamentDetail();
  }, [id]);

  const loadTournamentDetail = async () => {
    try {
      const history = await getTournamentHistory();
      const tournamentDetail = history.find(t => t.tournament.id === id);
      if (tournamentDetail) {
        setTournament(tournamentDetail.tournament);
        setParticipants(tournamentDetail.participants);
        setMatches(tournamentDetail.matches);
      }
    } catch (error) {
      console.error('Failed to load tournament detail:', error);
    }
  };

  // 勝敗記録を集計
  const results = participants.reduce((acc, participant) => {
    const wonMatches = matches.filter(m => m.winner_id === participant.id);
    const lostMatches = matches.filter(m => 
      (m.player1_id === participant.id || m.player2_id === participant.id) && 
      m.winner_id && 
      m.winner_id !== participant.id
    );

    acc[participant.id] = {
      id: participant.id,
      name: participant.name,
      wins: wonMatches.length,
      losses: lostMatches.length,
      points: wonMatches.length * 3,
    };
    return acc;
  }, {} as Record<string, {
    id: string;
    name: string;
    wins: number;
    losses: number;
    points: number;
  }>);

  // 順位順にソート
  const sortedResults = Object.values(results).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });

  const getMatchParticipants = (match: Match) => {
    const player1 = participants.find(p => p.id === match.player1_id);
    const player2 = participants.find(p => p.id === match.player2_id);
    const winner = match.winner_id ? participants.find(p => p.id === match.winner_id) : null;
    return { player1, player2, winner };
  };

  if (!tournament) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.date}>
            {new Date(tournament.created_at * 1000).toLocaleDateString('ja-JP', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
          <Text style={styles.participantsCount}>
            参加者: {participants.length}名
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最終結果</Text>
          <View style={styles.resultsTable}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, styles.rankCell]}>順位</Text>
              <Text style={[styles.headerCell, styles.nameCell]}>名前</Text>
              <Text style={[styles.headerCell, styles.statsCell]}>勝</Text>
              <Text style={[styles.headerCell, styles.statsCell]}>敗</Text>
              <Text style={[styles.headerCell, styles.statsCell]}>Pts</Text>
            </View>

            {sortedResults.map((result, index) => (
              <View 
                key={result.id} 
                style={[
                  styles.tableRow,
                  index === 0 && styles.winnerRow
                ]}>
                <View style={[styles.cell, styles.rankCell]}>
                  <Text style={[
                    styles.rankText,
                    index === 0 && styles.winnerText
                  ]}>
                    {index + 1}
                  </Text>
                  {index === 0 && (
                    <MaterialIcons name="emoji-events" size={16} color="#FFD700" />
                  )}
                </View>
                <Text style={[
                  styles.cell, 
                  styles.nameCell,
                  index === 0 && styles.winnerText
                ]}>
                  {result.name}
                </Text>
                <Text style={[
                  styles.cell, 
                  styles.statsCell,
                  index === 0 && styles.winnerText
                ]}>
                  {result.wins}
                </Text>
                <Text style={[
                  styles.cell, 
                  styles.statsCell,
                  index === 0 && styles.winnerText
                ]}>
                  {result.losses}
                </Text>
                <Text style={[
                  styles.cell, 
                  styles.statsCell,
                  index === 0 && styles.winnerText
                ]}>
                  {result.points}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>対戦履歴</Text>
          {matches.map((match) => {
            const { player1, player2, winner } = getMatchParticipants(match);
            if (!player1 || !player2) return null;

            return (
              <View key={match.id} style={styles.matchCard}>
                <View style={styles.matchResult}>
                  <Text style={[
                    styles.playerName,
                    winner?.id === player1.id && styles.winnerName
                  ]}>
                    {player1.name}
                  </Text>
                  <Text style={styles.vsText}>vs</Text>
                  <Text style={[
                    styles.playerName,
                    winner?.id === player2.id && styles.winnerName
                  ]}>
                    {player2.name}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
  },
  loadingText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 20,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  date: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  participantsCount: {
    fontSize: 16,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 16,
  },
  resultsTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F6F8FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    padding: 12,
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8E8E93',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
    padding: 12,
  },
  winnerRow: {
    backgroundColor: '#E3F2FD',
  },
  cell: {
    fontSize: 16,
    color: '#1C1C1E',
  },
  rankCell: {
    width: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nameCell: {
    flex: 1,
  },
  statsCell: {
    width: 50,
    textAlign: 'center',
  },
  rankText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  winnerText: {
    color: '#007AFF',
  },
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  matchResult: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerName: {
    flex: 1,
    fontSize: 16,
    color: '#1C1C1E',
  },
  winnerName: {
    fontWeight: 'bold',
    color: '#007AFF',
  },
  vsText: {
    fontSize: 14,
    color: '#8E8E93',
    marginHorizontal: 12,
  },
});