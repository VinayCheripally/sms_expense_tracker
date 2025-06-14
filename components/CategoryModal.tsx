import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { X, Check, ShoppingBag, Coffee, Car, Home, Gamepad2, MoreHorizontal } from 'lucide-react-native';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (category: string) => void;
  currentCategory?: string;
}

const categories = [
  { name: 'Food', icon: Coffee, color: '#F97316' },
  { name: 'Shopping', icon: ShoppingBag, color: '#8B5CF6' },
  { name: 'Transport', icon: Car, color: '#06B6D4' },
  { name: 'Bills', icon: Home, color: '#EF4444' },
  { name: 'Entertainment', icon: Gamepad2, color: '#EC4899' },
  { name: 'Other', icon: MoreHorizontal, color: '#6B7280' },
];

export default function CategoryModal({ visible, onClose, onSelect, currentCategory }: CategoryModalProps) {
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleSelect = (category: string) => {
    onSelect(category);
    onClose();
    setCustomCategory('');
    setShowCustomInput(false);
  };

  const handleCustomSubmit = () => {
    if (customCategory.trim()) {
      handleSelect(customCategory.trim());
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Select Category</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X color="#6B7280" size={24} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {categories.map((category) => {
              const IconComponent = category.icon;
              const isSelected = currentCategory === category.name;
              
              return (
                <TouchableOpacity
                  key={category.name}
                  style={[styles.categoryItem, isSelected && styles.selectedItem]}
                  onPress={() => handleSelect(category.name)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                    <IconComponent color={category.color} size={24} />
                  </View>
                  <Text style={[styles.categoryName, isSelected && styles.selectedText]}>
                    {category.name}
                  </Text>
                  {isSelected && <Check color="#10B981" size={20} />}
                </TouchableOpacity>
              );
            })}

            {showCustomInput ? (
              <View style={styles.customInput}>
                <TextInput
                  style={styles.input}
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChangeText={setCustomCategory}
                  autoFocus
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={handleCustomSubmit}
                >
                  <Check color="white" size={20} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.addCustomButton}
                onPress={() => setShowCustomInput(true)}
              >
                <Text style={styles.addCustomText}>+ Add Custom Category</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedItem: {
    backgroundColor: '#E6FFFA',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  selectedText: {
    color: '#10B981',
    fontWeight: '600',
  },
  customInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#10B981',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addCustomButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },
  addCustomText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
});