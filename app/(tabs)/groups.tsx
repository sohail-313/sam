import React, { useEffect, useState } from "react";
import { OTPWidget } from "@msg91comm/sendotp-react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";

const widgetId = process.env.MSG91_WIDGET_ID;
const tokenAuth = process.env.MSG91_TOKEN_AUTH;

const App = () => {
  useEffect(() => {
    OTPWidget.initializeWidget(widgetId!, tokenAuth!);
  }, []);

  const [number, setNumber] = useState("");

  const handleSendOtp = async () => {
    console.log("Sending OTP for number:", number);
    const data = {
      identifier: "917093406513",
    };
    const response = await OTPWidget.sendOTP(data);
    console.log(response);
  };

  return (
    <View>
      <TextInput
        placeholder="Number"
        value={number}
        keyboardType="numeric"
        style={{ backgroundColor: "#ededed", margin: 10 }}
        onChangeText={(text) => {
          setNumber(text);
        }}
      />
      <TouchableOpacity
        onPress={() => {
          handleSendOtp();
        }}
      >
        <Text>Send OTP</Text>
      </TouchableOpacity>
    </View>
  );
};

export default App;
