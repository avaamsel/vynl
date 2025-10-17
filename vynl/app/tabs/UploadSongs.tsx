import React from 'react';
import AppButton from '../../components/AppButton';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

const UploadSongs: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.topcontainer}>
        {/* Upload Image */}
        <Image 
          source={require('../../assets/images/upload.png')}
          style={styles.image}
        />

        <View style={styles.textcontainer}>
          <Text style={styles.title}>
            Upload songs
          </Text>
          {/* Center Text */}
          <Text style={styles.text}>
            Please select x songs to get started
          </Text>
        </View>
      </View>
      

      {/* Button at bottom */}
      <AppButton 
        title="Upload" 
        onPress={() => console.log('Button pressed')} 
        width={300}
      />
    </View>
  );
};

export default UploadSongs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 70,
    backgroundColor: 'white',
  },
  textcontainer: {
    alignItems: 'center',
    marginTop: 20, 
  },
  topcontainer: {
    alignItems: 'center',
    marginTop: 10, 
  },
  image: {
    width: 180,
    height: 180,
    marginTop: 80,
    resizeMode: 'contain',
  },
  title: {
    color: 'black',
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  text: {
    color: 'lightgrey',
    fontSize: 18,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 30,
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
