<template>
    <div>
        <v-stepper v-model="e6" vertical>
            <h3 align="center" style="padding:1em">Complete Profile</h3>
            <v-stepper-step :complete="e6 > 1" step="1">
                Create Account
            </v-stepper-step>

            <v-stepper-content step="1">
                <v-btn color="primary" @click="e6 = 2">
                    Continue
                </v-btn>
            </v-stepper-content>

            <v-stepper-step :complete="e6 > 2" step="2">
                Validate Account
            </v-stepper-step>

            <v-stepper-content step="2">
                <v-form @submit.prevent="submitForm" ref="form">
                    <v-text-field v-model="name" label="Name" :rules="nameRules" required></v-text-field>
                    <v-text-field v-model="email" label="Email" :rules="emailRules" required></v-text-field>
                    <v-text-field v-model="phone" label="Phone" :rules="phoneRules" required></v-text-field>
                    <v-text-field v-model="idCardNumber" label="ID Card Number" :rules="idCardNumberRules"
                        required></v-text-field>
                    <v-file-input v-model="idCardFrontImage" label="ID Card Front Image"
                        accept="image/*" required></v-file-input>
                    <v-file-input v-model="idCardBackImage" label="ID Card Back Image"
                        accept="image/*" required></v-file-input>
                    <v-file-input v-model="userPhoto" label="User Photo" accept="image/*"
                        required></v-file-input>
                </v-form>
                <v-btn color="primary" :disabled="!valid" @click="e6 = 3">
                    Continue
                </v-btn>
            </v-stepper-content>

            <v-stepper-step :complete="e6 > 3" step="3">
                Select an ad format and name ad unit
            </v-stepper-step>

            <v-stepper-content step="3">
                <v-card color="grey lighten-1" class="mb-12" height="200px"></v-card>
                <v-btn color="primary" @click="e6 = 4">
                    Continue
                </v-btn>
                <v-btn color="primary" @click="e6 = 2">
                    Back
                </v-btn>
            </v-stepper-content>

            <v-stepper-step step="4">
                View setup instructions
            </v-stepper-step>
            <v-stepper-content step="4">
                <v-card color="grey lighten-1" class="mb-12" height="200px"></v-card>
                <v-btn color="primary" @click="submitForm()">
                    Submit
                </v-btn>
                <v-btn color="primary" @click="e6 = 3">
                    Back
                </v-btn>
            </v-stepper-content>
        </v-stepper>
    </div>
</template>
<script>
export default {
    name: 'incomplete-auth',
    data: () => ({
        e6: 2,
        name: "",
        email: "",
        phone: "",
        idCardNumber: "",
        idCardFrontImage: null,
        idCardBackImage: null,
        userPhoto: null,
        nameRules: [
            (v) => !!v || "Name is required",
            (v) => v.length <= 50 || "Name must be less than 50 characters",
        ],
        emailRules: [
            (v) => !!v || "Email is required",
            (v) => /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(v) || "Email must be valid",
        ],
        phoneRules: [
            (v) => !!v || "Phone is required",
            (v) => /^\d{10}$/.test(v) || "Phone must be a 10 digit number",
        ],
        idCardNumberRules: [
            (v) => !!v || "ID card number is required",
            (v) => /^[A-Za-z0-9]+$/.test(v) || "ID card number must be alphanumeric",
        ],
    }),
    methods: {
        submitForm() {
            
            let formData = new FormData();
            if (this.valid)
            {
                formData.append("name", this.name);
                formData.append("email", this.email);
                formData.append("phone", this.phone);
                formData.append("idCardNumber", this.idCardNumber);
                formData.append("idCardFrontImage", this.idCardFrontImage);
                formData.append("idCardBackImage", this.idCardBackImage);
                formData.append("userPhoto", this.userPhoto);
                // Start Loader
                this.$store.dispatch('setLoading', true)
                this.$http.post("http://localhost:3000/adduserdetails", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                })
                .then((response) => {
                    // popup success message
                    // refresh keycloak token to get attributes
                    // 
                    this.$keycloak.loadUserProfile()
                    this.$keycloak.loadUserInfo()
                    this.$keycloak.updateToken(5).then(() => {
                        // Stop Loader

                        this.$store.dispatch('setLoading', false)
                        this.$store.dispatch('setMessage', "User details added successfully")
                        // redirect to home page
                        // hard refresh page to get attributes
                        this.$router.push({ name: 'home' })
                        // set timeout of 2 seconds to show success message
                        setTimeout(() => {
                            this.$router.go(0)
                        }, 2000);
                    }).catch(() => {
                        console.log('Failed to refresh token');
                    });
                    console.log(response);
                })
                .catch((error) => {
                    console.log(error);
                });
            }
            console.log("Name:", this.name);
            console.log("Email:", this.email);
            console.log("Phone:", this.phone);
            console.log("ID Card Number:", this.idCardNumber);
            console.log("ID Card Front Image:", this.idCardFrontImage);
            console.log("ID Card Back Image:", this.idCardBackImage);
            console.log("User Photo:", this.userPhoto);
        }
    },
    components: {
    },
    mounted() {
        this.name = this.$keycloak.tokenParsed.name;
        this.email = this.$keycloak.tokenParsed.email;
        this.phone = this.$keycloak.tokenParsed.phone_number;
    },
    computed: {
        valid() {
        if(this.name == "" || this.email == "" || this.phone == "" || this.idCardNumber == "" || this.idCardFrontImage == null || this.idCardBackImage == null || this.userPhoto == null)
            return false;
        else
            return true;

        },
    },
}

</script>
