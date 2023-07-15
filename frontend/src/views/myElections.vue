<template>
    <v-container>
        <div class="text-center">
            <!-- Create new election button -->
            <template>
                    <v-dialog v-model="dialog" fullscreen  transition="dialog-bottom-transition">
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on">
                                Create Election
                            </v-btn>
                        </template>
                        <v-card>
                            <v-toolbar dark color="primary">
                                <v-btn icon dark @click="dialog = false">
                                    <v-icon>mdi-close</v-icon>
                                </v-btn>
                                <v-toolbar-title>Create Election</v-toolbar-title>
                                <v-spacer></v-spacer>
                                <v-toolbar-items>
                                    <v-btn dark text @click="createElection">
                                        Submit
                                    </v-btn>
                                </v-toolbar-items>
                            </v-toolbar>
                            <v-container>

                                <v-form>
                                    <!-- Photo -->
                                    <v-file-input
                                        label="Election Photo"
                                        prepend-icon="mdi-camera"
                                        v-model="file"
                                    ></v-file-input>
                                    <v-text-field
                                        v-model="name"
                                        label="Name"
                                        required
                                    ></v-text-field>
                                    <el-tiptap v-model="description" :extensions="extensions" />
                                    <v-text-field
                                        label="Candidates"
                                        v-model="candidates"
                                        required
                                    ></v-text-field>
                                    <v-select
                                        :items="['Local', 'National']"
                                        label="Election Type"
                                        v-model="electionType"
                                        required
                                    ></v-select>
                                    <!-- Geo Restriction for voters -->
                                    <v-select
                                        :items="['Yes', 'No']"
                                        label="Geo Restriction"
                                        v-model="geoRestriction"
                                        required
                                    ></v-select>
                                    <v-autocomplete
                                        v-if="geoRestriction === 'Yes'"
                                        v-model="contry"
                                        :items="countriesArr"
                                        label="Contry"
                                    ></v-autocomplete>
                                    <v-autocomplete
                                        v-if="geoRestriction === 'Yes'"
                                        v-model="state"
                                        :items="stateArr"
                                        label="State"
                                    ></v-autocomplete>
                                    <!-- start date input and end date -->
                                    <v-menu
                                    ref="menu"
                                    v-model="menu"
                                    :close-on-content-click="false"
                                    transition="scale-transition"
                                    offset-y
                                    min-width="290px"
                                >
                                    <template v-slot:activator="{ on, attrs }">
                                    <v-text-field
                                        v-model="date"
                                        label="Date Range"
                                        readonly
                                        v-bind="attrs"
                                        v-on="on"
                                    ></v-text-field>
                                    </template>
                                    <v-date-picker
                                    range
                                    ref="picker"
                                    v-model="date"
                                    ></v-date-picker>
                                </v-menu>
                                    
                                </v-form>
                            </v-container>
                        </v-card>
                    </v-dialog>
            </template> 
            <v-divider class="my-3"></v-divider>
            <div>
                <electioncard />
            </div>
        </div>
    </v-container>
</template>

<script>
import countires from '@/assets/countires.json'
import electioncard from '../components/vote-card.vue'
import { ElementTiptap } from 'element-tiptap';
import {
  Doc,
  Text,
  Paragraph,
  Heading,
  Bold,
  Underline,
  Italic,
  Strike,
  ListItem,
  BulletList,
  OrderedList,
} from 'element-tiptap';
export default {
    components: {
        electioncard,
        'el-tiptap': ElementTiptap,
    },
    name: 'vote-card',

    data: () => ({
        dialog: false,
        date: null,
        file: null,
        name: null,
        countriesArr: [],
        geoRestriction: null,
        countires: countires,
        electionType: null,
        candidates: null,
        state: null,
        contry: null,
        menu: null,
        save: null,
        extensions: [
        new Doc(),
        new Text(),
        new Paragraph(),
        new Heading({ level: 5 }),
        new Bold({ bubble: true }), // render command-button in bubble menu.
        new Underline({ bubble: true, menubar: false }), // render command-button in bubble menu but not in menubar.
        new Italic(),
        new Strike(),
        new ListItem(),
        new BulletList(),
        new OrderedList(),
      ],
      // editor's content
      description: `
        <h1>Heading</h1>
        <p>Welcome to Vote!</p>
      `,
    }),
    methods: {
        createElection() {
            try {
                this.$store.dispatch('setLoading', true)
                let formData = new FormData();
                formData.append('file', this.file);
                formData.append('name', this.name);
                formData.append('description', this.description);
                formData.append('candidates', this.candidates);
                formData.append('type', this.electionType);
                formData.append('geoRestriction', this.geoRestriction);
                formData.append('contry', this.contry);
                formData.append('state', this.state);
                formData.append('date', this.date);
                this.$http.post ( `${process.env.VUE_APP_ES_BASE_URL}/add/election`, formData ).then(function () {
                });
                this.$store.dispatch('setLoading', false)
                this.$store.dispatch('setMessage', "Election created successfully")
                this.dialog = false
            }
            catch (error) {
                console.log(error)
            }
        }
    },
    computed: {
        stateArr() {
            return this.countires[this.contry]
        }
    },
    mounted() {
        for (const key in countires) {
        this.countriesArr.push(key)
        }
  }
}
</script>
