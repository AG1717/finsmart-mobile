import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Dimensions, Platform, Image, StatusBar, Alert, DimensionValue } from 'react-native';
import { Svg, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
const MAX_WIDTH = 600; // Maximum width for web to keep it centered
const isSmallScreen = SCREEN_WIDTH < 375;
const scale = SCREEN_WIDTH / 375; // Base on iPhone SE width

// API URL - Production Hostilo
// const API_URL = 'https://finsmart-api.geniusmedia.net/api/v1'; // Production Hostilo
const API_URL = 'https://finsmart-backend.onrender.com/api/v1'; // Render.com
//const API_URL = 'http://localhost:3000/api/v1'; // Local testing

// Responsive font size
const responsiveFontSize = (size: number) => {
  return Math.round(size * Math.min(scale, 1.2));
};

type Screen = 'welcome' | 'login' | 'register' | 'dashboard';

// Logo Component - Using actual logo image
const Logo = ({ size = 120 }: { size?: number }) => (
  <Image
    source={require('./assets/logo.jpeg')}
    style={{ width: size, height: size }}
    resizeMode="contain"
  />
);

export default function App() {
  // Main component with contextual menu for goals
  const [currentScreen, setCurrentScreen] = useState<Screen>('welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [user, setUser] = useState<any>(null);
  const [goals, setGoals] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'short' | 'long' | 'suggestion'>('overview');
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [showEditGoal, setShowEditGoal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [newGoal, setNewGoal] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '0',
    targetDate: '',
    timeframe: 'short',
    category: 'necessity',
    icon: '🎯'
  });

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000); // Hide after 3 seconds
  };

  const handleDateInput = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/[^\d]/g, '');

    let formatted = '';

    // Format as YYYY-MM-DD
    if (cleaned.length > 0) {
      // Year (first 4 digits)
      formatted = cleaned.substring(0, 4);

      if (cleaned.length >= 5) {
        // Month (next 2 digits, max 12)
        const month = cleaned.substring(4, 6);
        const monthNum = parseInt(month, 10);

        // Limit month to 12
        if (monthNum > 12) {
          formatted += '-12';
        } else if (month.length === 2) {
          formatted += '-' + month;
        } else if (month.length === 1 && monthNum > 1) {
          formatted += '-0' + month;
        } else {
          formatted += '-' + month;
        }

        if (cleaned.length >= 7) {
          // Day (next 2 digits, max 31)
          const day = cleaned.substring(6, 8);
          const dayNum = parseInt(day, 10);

          // Limit day to 31
          if (dayNum > 31) {
            formatted += '-31';
          } else if (day.length === 2) {
            formatted += '-' + day;
          } else if (day.length === 1 && dayNum > 3) {
            formatted += '-0' + day;
          } else {
            formatted += '-' + day;
          }
        }
      }
    }

    setNewGoal({...newGoal, targetDate: formatted});
  };

  const validateDate = (dateString: string): boolean => {
    if (!dateString || dateString.trim() === '') {
      return true; // Empty date is optional
    }

    // Check format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return false;
    }

    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    // Check if month is valid (1-12)
    if (month < 1 || month > 12) {
      return false;
    }

    // Check if day is valid for the given month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day < 1 || day > daysInMonth) {
      return false;
    }

    // Check if year is reasonable (not in the past, not too far in future)
    const currentYear = new Date().getFullYear();
    if (year < currentYear || year > currentYear + 100) {
      return false;
    }

    // Create date and check if it's valid
    const date = new Date(year, month - 1, day);
    if (isNaN(date.getTime())) {
      return false;
    }

    // Check if date is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      return false;
    }

    return true;
  };

  const handleLogin = async () => {
    // Validate inputs
    if (!email || !email.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!password || password.length < 1) {
      showToast('Please enter your password', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAuthenticated(true);
        const token = data.data.tokens.accessToken;
        setAccessToken(token);
        setUser(data.data.user);
        // Fetch goals after login
        await fetchGoals(token);
        changeScreen('dashboard');

        // Track login event
        setTimeout(() => {
          trackEvent('user_login', { email: email.toLowerCase().trim() });
        }, 100);
      } else {
        showToast(`Error: ${data.error?.message || 'Login failed'}`, 'error');
      }
    } catch (error) {
      showToast('Network error. Is the backend running?', 'error');
    }
  };

  const fetchGoals = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setGoals(data.data.goals || []);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const trackEvent = async (eventType: string, eventData: any = {}) => {
    try {
      await fetch(`${API_URL}/analytics/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          eventType,
          eventData,
          metadata: {
            deviceType: Platform.OS,
            platform: isWeb ? 'web' : 'mobile',
            appVersion: '1.0.0'
          }
        })
      });
    } catch (error) {
      // Silent fail - analytics shouldn't block user actions
      console.log('Analytics tracking failed:', error);
    }
  };

  // Helper function for smooth screen transitions
  const changeScreen = (newScreen: Screen) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentScreen(newScreen);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 100);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAccessToken('');
    setUser(null);
    setGoals([]);
    setEmail('');
    setPassword('');
    setUsername('');
    changeScreen('welcome');
  };

  const getFilteredGoals = () => {
    if (activeTab === 'overview') return goals;
    if (activeTab === 'short') return goals.filter(g => g.timeframe === 'short');
    if (activeTab === 'long') return goals.filter(g => g.timeframe === 'long');
    return goals;
  };

  const getTotalStats = () => {
    const totalTarget = goals.reduce((sum, g) => sum + (g.amounts?.target || 0), 0);
    const totalCurrent = goals.reduce((sum, g) => sum + (g.amounts?.current || 0), 0);
    const completedGoals = goals.filter(g => g.status === 'completed').length;

    // Short term goals stats
    const shortTermGoalsList = goals.filter(g => g.timeframe === 'short');
    const shortTermTarget = shortTermGoalsList.reduce((sum, g) => sum + (g.amounts?.target || 0), 0);
    const shortTermCurrent = shortTermGoalsList.reduce((sum, g) => sum + (g.amounts?.current || 0), 0);

    // Long term goals stats
    const longTermGoalsList = goals.filter(g => g.timeframe === 'long');
    const longTermTarget = longTermGoalsList.reduce((sum, g) => sum + (g.amounts?.target || 0), 0);
    const longTermCurrent = longTermGoalsList.reduce((sum, g) => sum + (g.amounts?.current || 0), 0);

    // Calculer les pourcentages de progression (0 si pas d'objectifs)
    const achievedProgress = goals.length > 0 ? (completedGoals / goals.length) * 100 : 0;
    const shortTermProgress = shortTermTarget > 0 ? (shortTermCurrent / shortTermTarget) * 100 : 0;
    const longTermProgress = longTermTarget > 0 ? (longTermCurrent / longTermTarget) * 100 : 0;
    const savingProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

    return {
      totalTarget,
      totalCurrent,
      completedGoals,
      shortTermGoals: shortTermGoalsList.length,
      shortTermTarget,
      shortTermCurrent,
      longTermGoals: longTermGoalsList.length,
      longTermTarget,
      longTermCurrent,
      activeGoals: goals.filter(g => g.status === 'active').length,
      // Pourcentages pré-calculés
      achievedProgress,
      shortTermProgress,
      longTermProgress,
      savingProgress
    };
  };

  const handleCreateGoal = async () => {
    // Validation
    if (!newGoal.name.trim()) {
      showToast('Please enter a goal name', 'error');
      return;
    }
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      showToast('Please enter a valid target amount', 'error');
      return;
    }
    if (!validateDate(newGoal.targetDate)) {
      showToast('Invalid date format. Use YYYY-MM-DD with valid month (1-12) and day', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: newGoal.name,
          category: newGoal.category,
          timeframe: newGoal.timeframe,
          amounts: {
            current: parseFloat(newGoal.currentAmount) || 0,
            target: parseFloat(newGoal.targetAmount),
            currency: user?.preferences?.currency || { code: 'USD', symbol: '$' }
          },
          dates: {
            target: newGoal.targetDate || undefined
          },
          icon: newGoal.icon
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateGoal(false);
        // Reset form
        setNewGoal({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: '',
          timeframe: 'short',
          category: 'necessity',
          icon: '🎯'
        });
        // Refresh goals to show the new goal
        await fetchGoals(accessToken);
        showToast('Goal created successfully!');

        // Track goal creation
        trackEvent('goal_created', {
          category: newGoal.category,
          timeframe: newGoal.timeframe,
          targetAmount: parseFloat(newGoal.targetAmount)
        });
      } else {
        showToast(`Error: ${data.error?.message || 'Failed to create goal'}`, 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    try {
      const response = await fetch(`${API_URL}/goals/${goalId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        // Refresh goals after deletion
        await fetchGoals(accessToken);
        showToast('Goal deleted successfully!');

        // Track goal deletion
        trackEvent('goal_deleted', { goalId });
      } else {
        const data = await response.json();
        showToast(`Error: ${data.error?.message || 'Failed to delete goal'}`, 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  // Supprimer TOUS les objectifs
  const handleDeleteAllGoals = async () => {
    if (goals.length === 0) {
      showToast('No goals to delete', 'error');
      return;
    }

    try {
      // Utiliser le nouvel endpoint pour supprimer tous les objectifs
      const response = await fetch(`${API_URL}/goals/all`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        const deletedCount = data.data?.deletedCount || goals.length;
        // Vider la liste locale
        setGoals([]);
        showToast(`${deletedCount} goals deleted. Counter reset to 0!`, 'success');

        // Track reset
        trackEvent('all_goals_deleted', { count: deletedCount });
      } else {
        showToast(`Error: ${data.error?.message || 'Failed to delete goals'}`, 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleEditGoal = (goal: any) => {
    // Pre-fill the form with existing goal data
    setEditingGoalId(goal._id);
    setNewGoal({
      name: goal.name,
      targetAmount: goal.amounts?.target?.toString() || '',
      currentAmount: goal.amounts?.current?.toString() || '0',
      targetDate: goal.dates?.target ? new Date(goal.dates.target).toISOString().split('T')[0] : '',
      timeframe: goal.timeframe,
      category: goal.category,
      icon: goal.icon || '🎯'
    });
    setShowEditGoal(true);
  };

  const handleUpdateGoal = async () => {
    // Validation
    if (!newGoal.name.trim()) {
      showToast('Please enter a goal name', 'error');
      return;
    }
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      showToast('Please enter a valid target amount', 'error');
      return;
    }
    if (!validateDate(newGoal.targetDate)) {
      showToast('Invalid date format. Use YYYY-MM-DD with valid month (1-12) and day', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/goals/${editingGoalId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          name: newGoal.name,
          category: newGoal.category,
          timeframe: newGoal.timeframe,
          amounts: {
            current: parseFloat(newGoal.currentAmount) || 0,
            target: parseFloat(newGoal.targetAmount),
            currency: user?.preferences?.currency || { code: 'USD', symbol: '$' }
          },
          dates: {
            target: newGoal.targetDate || undefined
          },
          icon: newGoal.icon
        })
      });

      const data = await response.json();

      if (response.ok) {
        setShowEditGoal(false);
        setEditingGoalId(null);
        // Reset form
        setNewGoal({
          name: '',
          targetAmount: '',
          currentAmount: '0',
          targetDate: '',
          timeframe: 'short',
          category: 'necessity',
          icon: '🎯'
        });
        // Refresh goals to show the updated goal
        await fetchGoals(accessToken);
        showToast('Goal updated successfully!');

        // Track goal update
        trackEvent('goal_updated', {
          goalId: editingGoalId,
          category: newGoal.category,
          timeframe: newGoal.timeframe
        });
      } else {
        showToast(`Error: ${data.error?.message || 'Failed to update goal'}`, 'error');
      }
    } catch (error) {
      showToast('Network error', 'error');
    }
  };

  const handleRegister = async () => {
    // Validate password format
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      showToast('Password must be at least 8 characters with uppercase, lowercase, and number', 'error');
      return;
    }

    // Validate username format
    const usernameRegex = /^[a-zA-Z0-9]+$/;
    if (!usernameRegex.test(username)) {
      showToast('Username can only contain letters and numbers', 'error');
      return;
    }

    if (username.length < 3) {
      showToast('Username must be at least 3 characters long', 'error');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          email,
          password,
          language: 'fr',
          currency: { code: 'USD', symbol: '$' }
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast('Account created successfully! Please login.', 'success');
        setPassword(''); // Clear password for security
        setUsername(''); // Clear username
        changeScreen('login');
      } else {
        showToast(`Error: ${data.error?.message || 'Registration failed'}`, 'error');
      }
    } catch (error) {
      showToast('Network error. Is the backend running?', 'error');
    }
  };

  // Welcome Screen
  if (currentScreen === 'welcome') {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Logo size={100} />
            <Text style={styles.appName}>FinSmart</Text>
          </View>

          {/* Blue rounded background */}
          <View style={styles.blueSection}>
            <Text style={styles.tagline}>Reach financial goals{'\n'}Smarter and Faster</Text>

            <View style={styles.buttonsContainer}>
              <TouchableOpacity
                style={[styles.button, styles.signUpButton]}
                onPress={() => changeScreen('register')}
              >
                <Text style={styles.signUpButtonText}>Sign Up</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.loginButton]}
                onPress={() => changeScreen('login')}
              >
                <Text style={styles.loginButtonText}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Login Screen
  if (currentScreen === 'login') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        {/* Logo at top */}
        <View style={styles.loginLogoContainer}>
          <Logo size={80} />
          <Text style={styles.appNameSmall}>FinSmart</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.accountTitle}>Account</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.loginInput}
              placeholder="Username, Email"
              placeholderTextColor="#B0B0B0"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.loginInput}
              placeholder="Password"
              placeholderTextColor="#B0B0B0"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={styles.loginSubmitButton}
            onPress={handleLogin}
          >
            <Text style={styles.loginSubmitButtonText}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Dashboard Screen
  if (currentScreen === 'dashboard') {
    const stats = getTotalStats();
    const filteredGoals = getFilteredGoals();
    const currencySymbol = user?.preferences?.currency?.symbol || '$';

    return (
      <View style={styles.dashboardContainer}>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.dashboardTitle}>Dashboard</Text>
          <TouchableOpacity
            style={styles.profileContainer}
            onPress={() => setShowProfile(true)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <Text style={styles.usernameText}>{user?.username || 'User'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView>
          {/* Goal Amount Card with Gradient */}
          <View style={styles.goalCardContainer}>
            <Svg height="100%" width="100%" style={StyleSheet.absoluteFill}>
              <Defs>
                <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor="#0F4C75" stopOpacity="1" />
                  <Stop offset="100%" stopColor="#1E6FAE" stopOpacity="1" />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#grad)" rx="16" />
            </Svg>
            <View style={styles.goalCardContent}>
              <Text style={styles.goalLabel}>Goal Amount reached</Text>
              <View style={styles.goalAmountContainer}>
                <Text style={styles.goalAmount}>
                  {currencySymbol}{stats.totalCurrent.toFixed(2)}
                </Text>
                <Text style={styles.goalTotal}> of {currencySymbol}{stats.totalTarget.toFixed(2)}</Text>
              </View>

              {/* Badges */}
              <View style={styles.badgesContainer}>
                <View style={styles.badge}>
                  <View style={styles.badgeIconContainer}>
                    <Svg width="60" height="60">
                      <Circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="#E0E0E0"
                        strokeWidth="4"
                        fill="none"
                      />
                      {stats.achievedProgress > 0 && (
                        <Circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="#00C9A7"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${stats.achievedProgress * 1.57} 157`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          rotation="-90"
                          origin="30, 30"
                        />
                      )}
                    </Svg>
                    <View style={styles.badgeIconInner}>
                      <Image source={require('./assets/icone-achieved.jpeg')} style={styles.badgeImage} />
                    </View>
                  </View>
                  <Text style={styles.badgeLabel}>Achieved</Text>
                  <Text style={styles.badgePercent}>{Math.round(stats.achievedProgress)}%</Text>
                </View>

                <View style={styles.badge}>
                  <View style={styles.badgeIconContainer}>
                    <Svg width="60" height="60">
                      <Circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="#E0E0E0"
                        strokeWidth="4"
                        fill="none"
                      />
                      {stats.shortTermProgress > 0 && (
                        <Circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="#00C9A7"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${stats.shortTermProgress * 1.57} 157`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          rotation="-90"
                          origin="30, 30"
                        />
                      )}
                    </Svg>
                    <View style={styles.badgeIconInner}>
                      <Image source={require('./assets/icone-short-term.jpeg')} style={styles.badgeImage} />
                    </View>
                  </View>
                  <Text style={styles.badgeLabel}>Short term</Text>
                  <Text style={styles.badgePercent}>{Math.round(stats.shortTermProgress)}%</Text>
                </View>

                <View style={styles.badge}>
                  <View style={styles.badgeIconContainer}>
                    <Svg width="60" height="60">
                      <Circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="#E0E0E0"
                        strokeWidth="4"
                        fill="none"
                      />
                      {stats.longTermProgress > 0 && (
                        <Circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="#00C9A7"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${stats.longTermProgress * 1.57} 157`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          rotation="-90"
                          origin="30, 30"
                        />
                      )}
                    </Svg>
                    <View style={styles.badgeIconInner}>
                      <Image source={require('./assets/icone-long-term.jpeg')} style={styles.badgeImage} />
                    </View>
                  </View>
                  <Text style={styles.badgeLabel}>Long term</Text>
                  <Text style={styles.badgePercent}>{Math.round(stats.longTermProgress)}%</Text>
                </View>

                <View style={styles.badge}>
                  <View style={styles.badgeIconContainer}>
                    <Svg width="60" height="60">
                      <Circle
                        cx="30"
                        cy="30"
                        r="25"
                        stroke="#E0E0E0"
                        strokeWidth="4"
                        fill="none"
                      />
                      {stats.savingProgress > 0 && (
                        <Circle
                          cx="30"
                          cy="30"
                          r="25"
                          stroke="#00C9A7"
                          strokeWidth="4"
                          fill="none"
                          strokeDasharray={`${stats.savingProgress * 1.57} 157`}
                          strokeDashoffset="0"
                          strokeLinecap="round"
                          rotation="-90"
                          origin="30, 30"
                        />
                      )}
                    </Svg>
                    <View style={styles.badgeIconInner}>
                      <Image source={require('./assets/icone-saving.jpeg')} style={styles.badgeImage} />
                    </View>
                  </View>
                  <Text style={styles.badgeLabel}>Saving</Text>
                  <Text style={styles.badgePercent}>{Math.round(stats.savingProgress)}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Goals Section */}
          <View style={styles.goalsSection}>
            <View style={styles.goalsSectionHeader}>
              <Text style={styles.goalsTitle}>Goals</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowCreateGoal(true)}
              >
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
                onPress={() => setActiveTab('overview')}
              >
                <Text style={activeTab === 'overview' ? styles.tabTextActive : styles.tabText}>
                  Overview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'short' && styles.tabActive]}
                onPress={() => setActiveTab('short')}
              >
                <Text style={activeTab === 'short' ? styles.tabTextActive : styles.tabText}>
                  Short term
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'long' && styles.tabActive]}
                onPress={() => setActiveTab('long')}
              >
                <Text style={activeTab === 'long' ? styles.tabTextActive : styles.tabText}>
                  Long term
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'suggestion' && styles.tabActive]}
                onPress={() => setActiveTab('suggestion')}
              >
                <Text style={activeTab === 'suggestion' ? styles.tabTextActive : styles.tabText}>
                  Suggestion
                </Text>
              </TouchableOpacity>
            </View>

            {/* Goal Cards or Suggestions */}
            {activeTab === 'suggestion' ? (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Suggested Goals</Text>
                <Text style={styles.suggestionsSubtitle}>Tap on any suggestion to create a goal based on it</Text>

                {/* Survival Category */}
                <Text style={styles.suggestionCategoryTitle}>🛡️ Survival Goals</Text>
                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Emergency Fund',
                      targetAmount: '5000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'short',
                      category: 'survival',
                      icon: '🛡️'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>🛡️</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Emergency Fund</Text>
                    <Text style={styles.suggestionDescription}>Build a safety net for unexpected expenses</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}5,000</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Health Insurance',
                      targetAmount: '2000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'short',
                      category: 'survival',
                      icon: '🏥'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>🏥</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Health Insurance</Text>
                    <Text style={styles.suggestionDescription}>Cover medical expenses and health care</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}2,000</Text>
                  </View>
                </TouchableOpacity>

                {/* Necessity Category */}
                <Text style={styles.suggestionCategoryTitle}>🏠 Necessity Goals</Text>
                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'New Laptop',
                      targetAmount: '1500',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'short',
                      category: 'necessity',
                      icon: '💻'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>💻</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>New Laptop</Text>
                    <Text style={styles.suggestionDescription}>Upgrade your work equipment</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}1,500</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Car Repair Fund',
                      targetAmount: '1000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'short',
                      category: 'necessity',
                      icon: '🔧'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>🔧</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Car Repair Fund</Text>
                    <Text style={styles.suggestionDescription}>Save for vehicle maintenance</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}1,000</Text>
                  </View>
                </TouchableOpacity>

                {/* Lifestyle Category */}
                <Text style={styles.suggestionCategoryTitle}>✨ Lifestyle Goals</Text>
                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Dream Vacation',
                      targetAmount: '3000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'long',
                      category: 'lifestyle',
                      icon: '✈️'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>✈️</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Dream Vacation</Text>
                    <Text style={styles.suggestionDescription}>Plan your perfect getaway</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}3,000</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'New Car',
                      targetAmount: '25000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'long',
                      category: 'lifestyle',
                      icon: '🚗'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>🚗</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>New Car</Text>
                    <Text style={styles.suggestionDescription}>Save for your dream vehicle</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}25,000</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Home Down Payment',
                      targetAmount: '50000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'long',
                      category: 'lifestyle',
                      icon: '🏠'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>🏠</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Home Down Payment</Text>
                    <Text style={styles.suggestionDescription}>Save for your first home</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}50,000</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.suggestionCard}
                  onPress={() => {
                    setNewGoal({
                      name: 'Wedding Fund',
                      targetAmount: '15000',
                      currentAmount: '0',
                      targetDate: '',
                      timeframe: 'long',
                      category: 'lifestyle',
                      icon: '💍'
                    });
                    setShowCreateGoal(true);
                  }}
                >
                  <View style={styles.suggestionIconContainer}>
                    <Text style={styles.suggestionIcon}>💍</Text>
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionName}>Wedding Fund</Text>
                    <Text style={styles.suggestionDescription}>Plan your special day</Text>
                    <Text style={styles.suggestionAmount}>Suggested: {currencySymbol}15,000</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.goalCardsContainer}>
                {filteredGoals.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No goals yet. Click + to create one!</Text>
                  </View>
                ) : (
                  filteredGoals.map((goal) => (
                    <GoalCard
                      key={goal._id}
                      goal={goal}
                      goalId={goal._id}
                      icon={goal.icon || '🎯'}
                      title={goal.name}
                      date={goal.dates?.target ? new Date(goal.dates.target).toLocaleDateString() : 'No date'}
                      current={goal.amounts?.current || 0}
                      target={goal.amounts?.target || 0}
                      percentage={goal.progress?.percentage || 0}
                      currencySymbol={currencySymbol}
                      onDelete={handleDeleteGoal}
                      onEdit={handleEditGoal}
                    />
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Create Goal Modal */}
        <Modal
          visible={showCreateGoal}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setShowCreateGoal(false)}
        >
          <View style={styles.modalOverlay}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New Goal</Text>
                <TouchableOpacity onPress={() => setShowCreateGoal(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Goal Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="E.g., New Car, Vacation..."
                  value={newGoal.name}
                  onChangeText={(text) => setNewGoal({...newGoal, name: text})}
                />

                <Text style={styles.modalLabel}>Target Amount * ({currencySymbol})</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal({...newGoal, targetAmount: text})}
                />

                <Text style={styles.modalLabel}>Current Amount ({currencySymbol})</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newGoal.currentAmount}
                  onChangeText={(text) => setNewGoal({...newGoal, currentAmount: text})}
                />

                <Text style={styles.modalLabel}>Target Date (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD (e.g., 2026-12-31)"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={newGoal.targetDate}
                  onChangeText={handleDateInput}
                />
                <Text style={styles.helperText}>Format: YYYY-MM-DD (Month: 01-12, Day: 01-31)</Text>

                <Text style={styles.modalLabel}>Timeframe *</Text>
                <View style={styles.modalButtonGroup}>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.timeframe === 'short' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, timeframe: 'short'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.timeframe === 'short' && styles.modalButtonTextActive]}>
                      Short Term
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.timeframe === 'long' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, timeframe: 'long'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.timeframe === 'long' && styles.modalButtonTextActive]}>
                      Long Term
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Category *</Text>
                <View style={styles.modalButtonGroup}>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'survival' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'survival'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'survival' && styles.modalButtonTextActive]}>
                      Survival
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'necessity' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'necessity'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'necessity' && styles.modalButtonTextActive]}>
                      Necessity
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'lifestyle' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'lifestyle'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'lifestyle' && styles.modalButtonTextActive]}>
                      Lifestyle
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Icon</Text>
                <View style={styles.iconRow}>
                  {['🎯', '🏠', '🚗', '✈️', '💰', '🏖️', '📚', '💍'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.iconButton, newGoal.icon === emoji && styles.iconButtonActive]}
                      onPress={() => setNewGoal({...newGoal, icon: emoji})}
                    >
                      <Text style={styles.iconEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={handleCreateGoal}
                >
                  <Text style={styles.modalSubmitButtonText}>Create Goal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Edit Goal Modal */}
        <Modal
          visible={showEditGoal}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => {
            setShowEditGoal(false);
            setEditingGoalId(null);
          }}
        >
          <View style={styles.modalOverlay}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Goal</Text>
                <TouchableOpacity onPress={() => {
                  setShowEditGoal(false);
                  setEditingGoalId(null);
                }}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <Text style={styles.modalLabel}>Goal Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="E.g., New Car, Vacation..."
                  value={newGoal.name}
                  onChangeText={(text) => setNewGoal({...newGoal, name: text})}
                />

                <Text style={styles.modalLabel}>Target Amount * ({currencySymbol})</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newGoal.targetAmount}
                  onChangeText={(text) => setNewGoal({...newGoal, targetAmount: text})}
                />

                <Text style={styles.modalLabel}>Current Amount ({currencySymbol})</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  value={newGoal.currentAmount}
                  onChangeText={(text) => setNewGoal({...newGoal, currentAmount: text})}
                />

                <Text style={styles.modalLabel}>Target Date (Optional)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="YYYY-MM-DD (e.g., 2026-12-31)"
                  keyboardType="number-pad"
                  maxLength={10}
                  value={newGoal.targetDate}
                  onChangeText={handleDateInput}
                />
                <Text style={styles.helperText}>Format: YYYY-MM-DD (Month: 01-12, Day: 01-31)</Text>

                <Text style={styles.modalLabel}>Timeframe *</Text>
                <View style={styles.modalButtonGroup}>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.timeframe === 'short' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, timeframe: 'short'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.timeframe === 'short' && styles.modalButtonTextActive]}>
                      Short Term
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.timeframe === 'long' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, timeframe: 'long'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.timeframe === 'long' && styles.modalButtonTextActive]}>
                      Long Term
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Category *</Text>
                <View style={styles.modalButtonGroup}>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'survival' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'survival'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'survival' && styles.modalButtonTextActive]}>
                      Survival
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'necessity' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'necessity'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'necessity' && styles.modalButtonTextActive]}>
                      Necessity
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, newGoal.category === 'lifestyle' && styles.modalButtonActive]}
                    onPress={() => setNewGoal({...newGoal, category: 'lifestyle'})}
                  >
                    <Text style={[styles.modalButtonText, newGoal.category === 'lifestyle' && styles.modalButtonTextActive]}>
                      Lifestyle
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalLabel}>Icon</Text>
                <View style={styles.iconRow}>
                  {['🎯', '🏠', '🚗', '✈️', '💰', '🏖️', '📚', '💍'].map(emoji => (
                    <TouchableOpacity
                      key={emoji}
                      style={[styles.iconButton, newGoal.icon === emoji && styles.iconButtonActive]}
                      onPress={() => setNewGoal({...newGoal, icon: emoji})}
                    >
                      <Text style={styles.iconEmoji}>{emoji}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitButton}
                  onPress={handleUpdateGoal}
                >
                  <Text style={styles.modalSubmitButtonText}>Update Goal</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Toast Notification */}
        {/* Profile Modal */}
        <Modal
          visible={showProfile}
          animationType="slide"
          transparent={false}
          presentationStyle="fullScreen"
          statusBarTranslucent={true}
          onRequestClose={() => setShowProfile(false)}
        >
          <View style={styles.modalOverlay}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Profile</Text>
                <TouchableOpacity onPress={() => setShowProfile(false)}>
                  <Text style={styles.modalClose}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                {/* User Info Section */}
                <View style={styles.profileSection}>
                  <View style={styles.profileAvatarLarge}>
                    <Text style={styles.profileAvatarText}>👤</Text>
                  </View>
                  <Text style={styles.profileEmail}>{user?.email || 'email@example.com'}</Text>
                </View>

                {/* Statistics Section */}
                <View style={styles.profileStatsContainer}>
                  <Text style={styles.profileSectionTitle}>Statistics</Text>
                  <View style={styles.profileStatsRow}>
                    <View style={styles.profileStatCard}>
                      <Text style={styles.profileStatNumber}>{stats.completedGoals}</Text>
                      <Text style={styles.profileStatLabel}>Completed Goals</Text>
                    </View>
                    <View style={styles.profileStatCard}>
                      <Text style={styles.profileStatNumber}>{stats.activeGoals}</Text>
                      <Text style={styles.profileStatLabel}>Active Goals</Text>
                    </View>
                  </View>
                  <View style={styles.profileStatsRow}>
                    <View style={styles.profileStatCard}>
                      <Text style={styles.profileStatNumber}>{currencySymbol}{stats.totalCurrent.toLocaleString()}</Text>
                      <Text style={styles.profileStatLabel}>Total Saved</Text>
                    </View>
                    <View style={styles.profileStatCard}>
                      <Text style={styles.profileStatNumber}>{currencySymbol}{stats.totalTarget.toLocaleString()}</Text>
                      <Text style={styles.profileStatLabel}>Total Target</Text>
                    </View>
                  </View>
                </View>

                {/* Settings Section */}
                <View style={styles.profileSettingsContainer}>
                  <Text style={styles.profileSectionTitle}>Settings</Text>

                  <TouchableOpacity
                    style={styles.profileSettingItem}
                    onPress={() => {
                      // Toggle between FR and EN
                      const newLanguage = (user?.preferences?.language || 'EN') === 'EN' ? 'FR' : 'EN';
                      // Update user preferences (you can add API call here)
                      setUser({
                        ...user,
                        preferences: {
                          ...user?.preferences,
                          language: newLanguage
                        }
                      });
                      showToast(`Language changed to ${newLanguage}`, 'success');

                      // Track language change
                      trackEvent('language_changed', { newLanguage });
                    }}
                  >
                    <Text style={styles.profileSettingLabel}>Language</Text>
                    <View style={styles.profileSettingValueContainer}>
                      <Text style={styles.profileSettingValue}>{user?.preferences?.language || 'EN'}</Text>
                      <Text style={styles.profileSettingArrow}>›</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.profileSettingItem}
                    onPress={() => {
                      // Cycle through currencies: USD → EUR → GBP → XAF → USD
                      const currencies = [
                        { code: 'USD', symbol: '$' },
                        { code: 'EUR', symbol: '€' },
                        { code: 'GBP', symbol: '£' },
                        { code: 'XAF', symbol: 'FCFA' }
                      ];
                      const currentCode = user?.preferences?.currency?.code || 'USD';
                      const currentIndex = currencies.findIndex(c => c.code === currentCode);
                      const nextIndex = (currentIndex + 1) % currencies.length;
                      const newCurrency = currencies[nextIndex];

                      setUser({
                        ...user,
                        preferences: {
                          ...user?.preferences,
                          currency: newCurrency
                        }
                      });
                      showToast(`Currency changed to ${newCurrency.code}`, 'success');

                      // Track currency change
                      trackEvent('currency_changed', { newCurrency: newCurrency.code });
                    }}
                  >
                    <Text style={styles.profileSettingLabel}>Currency</Text>
                    <View style={styles.profileSettingValueContainer}>
                      <Text style={styles.profileSettingValue}>{user?.preferences?.currency?.code || 'USD'} ({currencySymbol})</Text>
                      <Text style={styles.profileSettingArrow}>›</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Reset All Goals Button */}
                <TouchableOpacity
                  style={styles.profileResetButton}
                  onPress={() => {
                    if (Platform.OS === 'web') {
                      if (window.confirm('Are you sure you want to delete ALL goals? This cannot be undone!')) {
                        handleDeleteAllGoals();
                      }
                    } else {
                      Alert.alert(
                        'Reset All Goals',
                        'Are you sure you want to delete ALL goals? This cannot be undone!',
                        [
                          { text: 'Cancel', style: 'cancel' },
                          { text: 'Delete All', style: 'destructive', onPress: handleDeleteAllGoals }
                        ]
                      );
                    }
                  }}
                >
                  <Text style={styles.profileResetText}>🗑️ Reset All Goals ({goals.length})</Text>
                </TouchableOpacity>

                {/* Logout Button */}
                <TouchableOpacity
                  style={styles.profileLogoutButton}
                  onPress={() => {
                    setShowProfile(false);
                    handleLogout();
                  }}
                >
                  <Text style={styles.profileLogoutText}>Logout</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Transition Overlay */}
        {isTransitioning && (
          <View style={styles.transitionOverlay}>
            <View style={styles.transitionContent}>
              <Text style={styles.transitionText}>Loading...</Text>
            </View>
          </View>
        )}

        {/* Toast Notification */}
        {toast && (
          <View style={[styles.toast, toast.type === 'success' ? styles.toastSuccess : styles.toastError]}>
            <Text style={styles.toastText}>{toast.message}</Text>
          </View>
        )}
      </View>
    );
  }

  // Register Screen
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Logo at top */}
      <View style={styles.loginLogoContainer}>
        <Logo size={80} />
        <Text style={styles.appNameSmall}>FinSmart</Text>
      </View>

      <View style={styles.formContainer}>
        <Text style={styles.accountTitle}>Create Account</Text>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.loginInput}
            placeholder="Username (letters and numbers only)"
            placeholderTextColor="#B0B0B0"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Text style={styles.helperText}>Min 3 characters, alphanumeric only</Text>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.loginInput}
            placeholder="Email"
            placeholderTextColor="#B0B0B0"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.loginInput}
            placeholder="Password"
            placeholderTextColor="#B0B0B0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <Text style={styles.helperText}>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</Text>
        </View>

        <TouchableOpacity
          style={styles.loginSubmitButton}
          onPress={handleRegister}
        >
          <Text style={styles.loginSubmitButtonText}>Sign Up</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => changeScreen('login')}>
          <Text style={styles.linkText}>Already have an account? Login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Goal Card Component
const GoalCard = ({ goal, goalId, icon, title, date, current, target, percentage, currencySymbol = '$', onDelete, onEdit }: any) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleDelete = () => {
    setShowMenu(false);
    onDelete(goalId);
  };

  const handleEdit = () => {
    setShowMenu(false);
    onEdit(goal);
  };

  return (
    <View style={styles.goalCardItem}>
      <View style={styles.goalCardHeader}>
        <View style={styles.goalCardIcon}>
          <Text style={styles.goalCardEmoji}>{icon}</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Svg width="50" height="50">
              <Circle
                cx="25"
                cy="25"
                r="20"
                stroke="#E0E0E0"
                strokeWidth="4"
                fill="none"
              />
              {percentage > 0 && (
                <Circle
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="#2ECC71"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${percentage * 1.257} 125.7`}
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  rotation="-90"
                  origin="25, 25"
                />
              )}
            </Svg>
          </View>
          <Text style={styles.progressPercentage}>{Math.round(percentage)}%</Text>
        </View>
      </View>

      <Text style={styles.goalCardTitle}>{title}</Text>
      <Text style={styles.goalCardDate}>{date}</Text>
      <Text style={styles.goalCardAmount}>
        <Text style={styles.goalCardCurrent}>{currencySymbol}{current.toFixed(2)}</Text>
        <Text style={styles.goalCardTarget}> of {currencySymbol}{target.toFixed(2)}</Text>
      </Text>

      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setShowMenu(!showMenu)}
      >
        <Text style={styles.menuButtonText}>⋮</Text>
      </TouchableOpacity>

      {/* Dropdown Menu */}
      {showMenu && (
        <View style={styles.dropdownMenu}>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleEdit}
          >
            <Text style={styles.menuItemText}>✏️ Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemDanger]}
            onPress={handleDelete}
          >
            <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>🗑️ Delete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// @ts-ignore - react-native-web types conflict with react-native types
const styles: Record<string, any> = StyleSheet.create({
  // Welcome Screen
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  welcomeContent: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E6FAE',
    marginTop: 10,
  },
  blueSection: {
    flex: 1,
    backgroundColor: '#1E6FAE',
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    paddingTop: 80,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 60,
  },
  buttonsContainer: {
    width: '100%',
    maxWidth: 400,
  },
  button: {
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 16,
  },
  signUpButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  signUpButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#FFFFFF',
  },
  loginButtonText: {
    color: '#1E6FAE',
    fontSize: 18,
    fontWeight: '600',
  },

  // Login Screen
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  loginLogoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appNameSmall: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E6FAE',
    marginTop: 10,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  accountTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E6FAE',
    textAlign: 'center',
    marginBottom: 40,
  },
  inputContainer: {
    marginBottom: 20,
  },
  loginInput: {
    borderWidth: 2,
    borderColor: '#1E6FAE',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    color: '#000000',
  },
  loginSubmitButton: {
    backgroundColor: '#1E6FAE',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  loginSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },

  // Dashboard Screen
  dashboardContainer: {
    flex: 1,
    backgroundColor: '#F5F6FA',
    width: '100%',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  backArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  dashboardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileContainer: {
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
  },
  usernameText: {
    fontSize: 10,
    color: '#666666',
    marginTop: 2,
    fontWeight: '500',
  },
  goalCardContainer: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  goalCardContent: {
    padding: 20,
  },
  goalLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
  },
  goalAmountContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  goalAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    flexShrink: 1,
  },
  goalTotal: {
    color: '#FFFFFF',
    fontSize: 18,
    flexShrink: 1,
  },
  badgesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
  },
  badge: {
    alignItems: 'center',
  },
  badgeIconContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  badgeIconInner: {
    position: 'absolute',
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  badgeEmoji: {
    fontSize: 24,
  },
  badgeImage: {
    width: 44,
    height: 44,
    resizeMode: 'contain',
    borderRadius: 22,
  },
  badgeLabel: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  badgePercent: {
    color: '#00C9A7',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 2,
  },
  badgeCount: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 3,
  },
  goalsSection: {
    padding: 20,
  },
  goalsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  goalsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E6FAE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: isSmallScreen ? 4 : 8,
    flexWrap: isSmallScreen ? 'wrap' : 'nowrap',
  },
  tab: {
    flex: isSmallScreen ? undefined : 1,
    minWidth: isSmallScreen ? '48%' : undefined,
    paddingVertical: 10,
    paddingHorizontal: isSmallScreen ? 4 : 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabActive: {
    backgroundColor: '#1E6FAE',
  },
  tabText: {
    color: '#666666',
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontSize: isSmallScreen ? 12 : 14,
    fontWeight: '600',
  },
  goalCardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: isWeb ? 16 : 0,
  },
  goalCardItem: {
    width: '48%' as DimensionValue,
    backgroundColor: '#FFFFFF',
    padding: isSmallScreen ? 12 : 16,
    borderRadius: 16,
    marginBottom: 16,
    ...(isWeb && {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    }),
  },
  goalCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalCardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCardEmoji: {
    fontSize: 24,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressCircle: {
    marginBottom: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2ECC71',
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },
  goalCardDate: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
  },
  goalCardAmount: {
    marginTop: 10,
  },
  goalCardCurrent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E6FAE',
  },
  goalCardTarget: {
    fontSize: 14,
    color: '#666666',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    color: '#666666',
    fontSize: 20,
    fontWeight: 'bold',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    right: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    minWidth: 120,
  },
  menuItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  menuItemText: {
    fontSize: 14,
    color: '#333333',
  },
  menuItemDanger: {
    borderBottomWidth: 0,
  },
  menuItemTextDanger: {
    color: '#FF4444',
  },
  linkText: {
    textAlign: 'center',
    color: '#1E6FAE',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 20,
  },
  helperText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 5,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 25 : 50,
    paddingBottom: Platform.OS === 'android' ? 80 : 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E6FAE',
  },
  modalClose: {
    fontSize: 24,
    color: '#666666',
  },
  modalBody: {
    padding: 20,
    paddingBottom: 40,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
    marginTop: 12,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#1E6FAE',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#000000',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#1E6FAE',
    backgroundColor: '#FFFFFF',
  },
  modalButtonActive: {
    backgroundColor: '#1E6FAE',
  },
  modalButtonText: {
    color: '#1E6FAE',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonTextActive: {
    color: '#FFFFFF',
  },
  iconRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  iconButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonActive: {
    borderColor: '#1E6FAE',
    backgroundColor: '#E3F2FD',
  },
  iconEmoji: {
    fontSize: 24,
  },
  modalSubmitButton: {
    backgroundColor: '#1E6FAE',
    padding: 16,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 10,
  },
  modalSubmitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  // Toast notification
  // Transition overlay
  transitionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10000,
  },
  transitionContent: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  transitionText: {
    fontSize: 16,
    color: '#1E6FAE',
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 9999,
  },
  toastSuccess: {
    backgroundColor: '#00C9A7',
  },
  toastError: {
    backgroundColor: '#FF4444',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Suggestions
  suggestionsContainer: {
    padding: 20,
  },
  suggestionsTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  suggestionsSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
  },
  suggestionCategoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginTop: 16,
    marginBottom: 12,
  },
  suggestionCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestionIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  suggestionIcon: {
    fontSize: 24,
  },
  suggestionContent: {
    flex: 1,
    justifyContent: 'center',
  },
  suggestionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  suggestionAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#00C9A7',
  },

  // Profile Modal
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatarText: {
    fontSize: 40,
  },
  profileUsername: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
    color: '#666666',
  },
  profileStatsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
    marginBottom: 16,
  },
  profileStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  profileStatCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
  },
  profileStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00C9A7',
    marginBottom: 4,
  },
  profileStatLabel: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
  },
  profileSettingsContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  profileSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  profileSettingLabel: {
    fontSize: 16,
    color: '#1A1A1A',
  },
  profileSettingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSettingValue: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
    marginRight: 8,
  },
  profileSettingArrow: {
    fontSize: 24,
    color: '#00C9A7',
    fontWeight: 'bold',
  },
  profileResetButton: {
    backgroundColor: '#FF8C00',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    alignItems: 'center',
  },
  profileResetText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileLogoutButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 16,
    borderRadius: 12,
    marginHorizontal: 20,
    marginTop: 0,
    marginBottom: 10,
    alignItems: 'center',
  },
  profileLogoutText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  profileFooter: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 40,
  },
  profileFooterText: {
    fontSize: 14,
    color: '#999999',
    marginBottom: 8,
  },
  profileFooterUsername: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A1A',
  },
});
