<template>
    <v-container>
        <v-card class="overflow-hidden">
            <v-img src="https://cdn.vuetifyjs.com/images/parallax/material2.jpg" height="125"
                gradient="to top right, rgba(100,115,201,.33), rgba(25,32,72,.7)">
                <v-row justify="space-around">
                    <v-avatar size="102" id="avatar">
                        <img src="https://cdn.vuetifyjs.com/images/john.jpg" alt="avatar" />
                    </v-avatar>
                </v-row>
            </v-img>
            <v-toolbar flat>
                <v-icon>mdi-account</v-icon>
                <v-toolbar-title class="font-weight-light">
                    User Profile
                </v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="light-blue accent-1" fab small @click="isEditing = !isEditing">
                    <v-icon v-if="isEditing">
                        mdi-close
                    </v-icon>
                    <v-icon v-else>
                        mdi-pencil
                    </v-icon>
                </v-btn>
            </v-toolbar>
            <v-card-text>
                <v-text-field :disabled="!isEditing" v-model="given_name" label="Name"></v-text-field>
                <v-text-field :disabled="!isEditing" v-model="family_name" label="Surname"></v-text-field>
                <v-text-field :disabled="!isEditing" v-model="email" label="Email"></v-text-field>
                <v-text-field :disabled="!isEditing" v-model="phone_number" label="Phone Number"></v-text-field>
            </v-card-text>
            <v-divider></v-divider>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn :disabled="!isEditing" color="green lighten-3" @click="save">
                    Save
                </v-btn>
            </v-card-actions>
            <v-snackbar v-model="hasSaved" :timeout="2000" absolute bottom>
                Your profile has been updated
            </v-snackbar>
        </v-card>
    </v-container>
</template>
<script>
export default {
    data() {
        return {
            hasSaved: false,
            isEditing: null,
            model: null,
            given_name: null,
            family_name: null,
            email: null,
            phone_number: null,
        }
    },
    mounted() {
        this.given_name = this.$keycloak.tokenParsed.given_name
        this.family_name = this.$keycloak.tokenParsed.family_name
        this.email = this.$keycloak.tokenParsed.email
        this.phone_number = this.$keycloak.tokenParsed.phone_number
    },
    methods: {
        customFilter(item, queryText) {
            const textOne = item.name.toLowerCase()
            const textTwo = item.abbr.toLowerCase()
            const searchText = queryText.toLowerCase()
            return textOne.indexOf(searchText) > -1 ||
                textTwo.indexOf(searchText) > -1
        },
        save() {
            this.isEditing = !this.isEditing
            this.hasSaved = true
            // Update in keycloak user profile
            this.$keycloak.updateToken(5).success(() => {
                this.$keycloak.loadUserProfile().success(() => {
                    this.$keycloak.tokenParsed.given_name = this.given_name
                    this.$keycloak.tokenParsed.family_name = this.family_name
                    this.$keycloak.tokenParsed.email = this.email
                    this.$keycloak.tokenParsed.phone_number = this.phone_number
                    this.$keycloak.updateProfile()
                })
            })
        },
    },
}
</script>