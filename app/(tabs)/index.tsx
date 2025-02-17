import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowForwardIcon } from '../../components/icons';

export default function StartScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>トーナメントマネージャー</Text>
      <View style={styles.buttonContainer}>
        <Link href="/tournament/members" asChild>
          <TouchableOpacity style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#4F8EF7', '#2F6CE3']}
              style={styles.button}>
              <ArrowForwardIcon size={32} color="#fff" />
              <Text style={styles.buttonText}>トーナメント戦</Text>
              <Text style={styles.buttonSubText}>
                勝ち抜き形式のトーナメントを作成
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>

        <Link href="/round-robin/members" asChild>
          <TouchableOpacity style={styles.buttonWrapper}>
            <LinearGradient
              colors={['#FF6B6B', '#EE5253']}
              style={styles.button}>
              <ArrowForwardIcon size={32} color="#fff" />
              <Text style={styles.buttonText}>総当たり戦</Text>
              <Text style={styles.buttonSubText}>
                全員が対戦する形式のトーナメントを作成
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Link>
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
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 40,
    color: '#1C1C1E',
  },
  buttonContainer: {
    gap: 20,
  },
  buttonWrapper: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  button: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  buttonSubText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    opacity: 0.8,
  },
});