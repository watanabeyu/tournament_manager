import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import Chance from 'chance';

const chance = new Chance();

// 名前のリスト
const firstNames = [
  '太郎', '次郎', '三郎', '四郎', '五郎',
  '花子', '桃子', '梅子', '菊子', '和子',
  '翔', '大翔', '蓮', '陽翔', '湊',
  '陽菜', '凛', '澪', '結衣', '美咲'
];

type Member = {
  id: string;
  name: string;
};

export default function TournamentMembersScreen() {
  const [members, setMembers] = useState<Member[]>([
    { id: chance.guid(), name: '' },
    { id: chance.guid(), name: '' }
  ]);
  const [isListening, setIsListening] = useState(false);

  const addMember = () => {
    setMembers([...members, { id: chance.guid(), name: '' }]);
  };

  const removeMember = (index: number) => {
    if (members.length <= 2) return;
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const updateMember = (text: string, index: number) => {
    const newMembers = [...members];
    newMembers[index] = { ...newMembers[index], name: text };
    setMembers(newMembers);
  };

  const generateRandomNames = () => {
    const count = Math.max(members?.length || 2, 2);
    const names = Array.from({ length: count }, () => ({
      id: chance.guid(),
      name: chance.pickone(firstNames)
    }));
    setMembers(names);
  };

  const startListening = async (index: number) => {
    if (Platform.OS === 'web') {
      alert('音声入力はモバイルデバイスでのみ利用可能です。');
      return;
    }

    setIsListening(true);
    try {
      const result = await Speech.speak('お名前をどうぞ', {
        language: 'ja-JP',
      });
      // Here you would typically integrate with the device's speech recognition
      // For this example, we'll just set a placeholder
      updateMember('音声入力テスト', index);
    } catch (error) {
      console.error(error);
    } finally {
      setIsListening(false);
    }
  };

  const proceedToMatches = () => {
    const validMembers = members.filter(m => m.name.trim() !== '');
    if (validMembers.length < 2) {
      alert('最低2名の参加者が必要です。');
      return;
    }
    router.push({
      pathname: '/tournament/matches',
      params: { members: JSON.stringify(validMembers) }
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {members.map((member, index) => (
          <View key={member.id} style={styles.memberRow}>
            <TextInput
              style={styles.input}
              value={member.name}
              onChangeText={(text) => updateMember(text, index)}
              placeholder={`参加者 ${index + 1}`}
            />
            <TouchableOpacity
              style={styles.micButton}
              onPress={() => startListening(index)}>
              <MaterialIcons
                name={isListening ? 'mic' : 'mic-none'}
                size={24}
                color="#007AFF"
              />
            </TouchableOpacity>
            {members.length > 2 && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeMember(index)}>
                <MaterialIcons name="cancel" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addButton} onPress={addMember}>
          <MaterialIcons name="add" size={24} color="#fff" />
          <Text style={styles.buttonText}>参加者を追加</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.randomButton}
          onPress={generateRandomNames}>
          <MaterialIcons name="shuffle" size={24} color="#fff" />
          <Text style={styles.buttonText}>ランダム生成</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={proceedToMatches}>
          <Text style={styles.buttonText}>組み合わせ確認へ</Text>
          <MaterialIcons name="arrow-forward" size={24} color="#fff" />
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
  scrollView: {
    flex: 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  micButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  randomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5856D6',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
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