<template>
    <v-card :loading="loading" class="mx-auto my-12" max-width="374">
        <template slot="progress">
            <v-progress-linear color="deep-purple" height="10" indeterminate></v-progress-linear>
        </template>

        <v-img height="250" :src=file></v-img>

        <v-card-title>Presidential</v-card-title>

        <v-card-text>
            <v-row class="mx-0">
                <v-rating :value="4.5" color="amber" dense half-increments readonly size="14"></v-rating>

                <div class="grey--text ms-4">
                    4.5 (413)
                </div>
            </v-row>

            <div class="my-4 text-subtitle-1">
                Local Election
            </div>

            <div>Vote Now To do something</div>
        </v-card-text>

        <v-divider class="mx-4"></v-divider>

        <v-card-title>Electioners Participating</v-card-title>

        <v-card-text>
            <v-row>
                <personcard />
                <personcard />
            </v-row>

        </v-card-text>
        <v-card-actions>
            <template>
                <v-row justify="center">
                    <v-dialog v-model="dialog" fullscreen hide-overlay transition="dialog-bottom-transition">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn color="green lighten-2" text v-bind="attrs" v-on="on" @click="type='vote'">
                                Vote
                            </v-btn>
                            <v-btn color="blue lighten-2" text v-bind="attrs" v-on="on" @click="type='edit'">
                                Edit
                            </v-btn>
                            <v-btn color="red lighten-2" text @click="console.log('cancel')">
                                Cancel
                            </v-btn>
                        </template>
                        <v-card v-if="type == 'vote'">
                            <v-toolbar dark color="primary">
                                <v-btn icon dark @click="dialog = false">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                                <v-toolbar-title>Vote</v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-toolbar-items>
                                    <v-btn dark text @click="dialog = false">
                                        Save
                                    </v-btn>
                                </v-toolbar-items>
                            </v-toolbar>
                        </v-card>
                        <v-card v-if="type == 'edit'">
                            <v-toolbar dark color="primary">
                                <v-btn icon dark @click="dialog = false">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                                <v-toolbar-title>Edit</v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-toolbar-items>
                                    <v-btn dark text @click="dialog = false">
                                        Save
                                    </v-btn>
                                </v-toolbar-items>
                            </v-toolbar>
                        </v-card>
                    </v-dialog>
                </v-row>
            </template> 
        </v-card-actions>
    </v-card>
</template>

<script>
import personcard from '../components/person-card.vue';
export default {
    data: () => ({
        loading: false,
        selection: 1,
        dialog: false,
        notifications: false,
        sound: true,
        widgets: false,
        type: '',
    }),
    components: {
        personcard,
    },
    props: ['created_by', 'created_date', 'description', 'end_date', '_id', 'file', 'name', 'start_date'],
    methods: {
        reserve() {
            this.loading = true

            setTimeout(() => (this.loading = false), 2000)
        },
    },
}
</script>