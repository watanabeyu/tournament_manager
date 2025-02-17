import { View, Text, StyleSheet, Alert } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { DeleteIcon } from '../../components/icons';
import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { router } from 'expo-router';

export default function SettingsScreen() {
  const resetDatabase = async () => {
    Alert.alert(
      'データベースのリセット',
      'すべての履歴が削除されます。この操作は取り消せません。',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'リセット',
          style: 'destructive',
          onPress: async () => {
            try {
              const db = SQLite.openDatabaseSync('tournaments.db');
              
              // すべてのテーブルを削除（変数なし）
              await db.execAsync(`
                DROP TABLE IF EXISTS round_robin_matches;
                DROP TABLE IF EXISTS round_robin_participants;
                DROP TABLE IF EXISTS round_robin_tournaments;
                DROP TABLE IF EXISTS tournament_matches;
                DROP TABLE IF EXISTS tournament_participants;
                DROP TABLE IF EXISTS tournament_tournaments;
              `);

              // テーブルを再作成（変数なし）
              await db.execAsync(`
                CREATE TABLE IF NOT EXISTS round_robin_tournaments (
                  id TEXT PRIMARY KEY,
                  created_at INTEGER DEFAULT (unixepoch()),
                  completed_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS round_robin_participants (
                  id TEXT PRIMARY KEY,
                  tournament_id TEXT NOT NULL,
                  name TEXT NOT NULL,
                  created_at INTEGER DEFAULT (unixepoch())
                );

                CREATE TABLE IF NOT EXISTS round_robin_matches (
                  id TEXT PRIMARY KEY,
                  tournament_id TEXT NOT NULL,
                  player1_id TEXT NOT NULL,
                  player2_id TEXT NOT NULL,
                  winner_id TEXT,
                  created_at INTEGER DEFAULT (unixepoch()),
                  completed_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS tournament_tournaments (
                  id TEXT PRIMARY KEY,
                  created_at INTEGER DEFAULT (unixepoch()),
                  completed_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS tournament_participants (
                  id TEXT PRIMARY KEY,
                  tournament_id TEXT NOT NULL,
                  name TEXT NOT NULL,
                  created_at INTEGER DEFAULT (unixepoch())
                );

                CREATE TABLE IF NOT EXISTS tournament_matches (
                  id TEXT PRIMARY KEY,
                  tournament_id TEXT NOT NULL,
                  round INTEGER NOT NULL,
                  player1_id TEXT NOT NULL,
                  player2_id TEXT,
                  winner_id TEXT,
                  created_at INTEGER DEFAULT (unixepoch()),
                  completed_at INTEGER
                );
              `);

              Alert.alert(
                'リセット完了',
                'データベースがリセットされました。',
                [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/')
                  }
                ]
              );
            } catch (error) {
              console.error('Failed to reset database:', error);
              Alert.alert('エラー', 'データベースのリセットに失敗しました。');
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>設定</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>データ管理</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={resetDatabase}>
          <DeleteIcon size={24} color="#fff" />
          <Text style={styles.buttonText}>データベースをリセット</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8FA',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1C1C1E',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1C1C1E',
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});