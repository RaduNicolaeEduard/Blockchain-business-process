<template>
  <div>

    <div v-if="this.$keycloak.authenticated">
      <v-menu bottom min-width="200px" rounded offset-y>
        <template v-slot:activator="{ on }">
          <v-btn icon x-large v-on="on">
            <v-avatar v-bind:color="create_color_from_name()" size="48">
              <span class="white--text text-h5">{{ TwoLetter() }}</span>
            </v-avatar>
          </v-btn>
        </template>
        <v-card>
          <v-list-item-content class="justify-center">
            <div class="mx-auto text-center">
              <v-avatar v-bind:color="create_color_from_name()">
                <span class="white--text text-h5">{{ TwoLetter() }}</span>
              </v-avatar>
              <h3>{{ this.$keycloak.tokenParsed.name }}</h3>
              <p class="text-caption mt-1">
                {{ this.$keycloak.tokenParsed.email }}
              </p>
              <v-divider class="my-3"></v-divider>
              <!-- <v-btn depressed rounded text @click="$router.push('/userprofile')"> -->
              <v-btn depressed rounded text @click="$router.push('/userprofile')">
                Edit Account
              </v-btn>
              <v-divider class="my-3"></v-divider>
              <v-btn depressed rounded text @click="logout()">
                Disconnect
              </v-btn>
            </div>
          </v-list-item-content>
        </v-card>
      </v-menu>
    </div>
    <div v-else>
      <v-btn depressed rounded text @click="login()">
        Login
      </v-btn>
    </div>
  </div>
</template>

<script>
export default {
  data: () => ({
    user: {
      initials: 'JD',
      fullName: 'John Doe',
      email: 'john.doe@doe.com',
    },
  }),
  methods: {
    TwoLetter() {
      let fullName = this.$keycloak.tokenParsed.name
      let initials = fullName.match(/\b\w/g) || []
      initials = ((initials.shift() || '') + (initials.pop() || '')).toUpperCase()
      return initials
    },
    create_color_from_name() {
      let fullName = this.$keycloak.tokenParsed.name
      let hash = 0
      for (let i = 0; i < fullName.length; i++) {
        hash = fullName.charCodeAt(i) + ((hash << 5) - hash)
      }
      let color = '#'
      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF
        color += ('00' + value.toString(16)).substr(-2)
      }
      return color
    },
    logout() {
      this.$keycloak.logout()
    },
    login() {
      this.$keycloak.login()
    },
  },
}
</script>