<template>
    <div>
        <v-container>
            <v-card elevation="0">
                <v-card-title>
                    <!-- search text field with cancel icon -->
                    <v-text-field v-model="search" append-icon="mdi-magnify" label="Search" single-line
                        hide-details></v-text-field>
                </v-card-title>
            </v-card>
        </v-container>
        <v-card elevation="0">
            <v-tabs v-model="tab" centered>
                <v-tabs-slider></v-tabs-slider>
                <v-tab href="#tab-1">
                    All Elections
                </v-tab>

                <v-tab href="#tab-2">
                    Closing Soon
                </v-tab>

                <v-tab href="#tab-3">
                    Local
                </v-tab>
                <v-tab href="#tab-4">
                    Presidential
                </v-tab>
            </v-tabs>

            <v-tabs-items v-model="tab">
                <v-tab-item v-for="i in 4" :key="i" :value="'tab-' + i">
                    <div class="election_view_padding">
                        <v-row>
                            <!-- No Data Card -->
                            <v-col v-if="emtpy_respnse">
                                <v-container>
                                    <v-card>
                                        <v-card-title>
                                            <v-icon>mdi-information-outline</v-icon>
                                            <span class="headline">No Data</span>
                                        </v-card-title>
                                        <v-card-text>
                                            <p>There is no data to display</p>
                                        </v-card-text>
                                    </v-card>
                                </v-container>
                            </v-col>
                            <v-col v-for="election in elections" :key="election._id">
                                <electioncard v-bind:file="election._source.file" style="width:20em" />
                            </v-col>
                        </v-row>
                    </div>
                </v-tab-item>
            </v-tabs-items>
            <div ref="end"></div>
        </v-card>
    </div>
</template>

<script>
import electioncard from '../components/vote-card.vue'
export default {
    components: {
        electioncard
    },
    mounted() {
        this.$nextTick(() => {
            window.addEventListener('scroll', this.scroll);
        });
    },
    beforeDestroy() {
        window.removeEventListener('scroll', this.scroll);
    },
    watch: {
        async search(new_search, old_search) {
            this.$store.dispatch('setLoading', true)
            let form = new FormData();
            form.append("search", new_search);
            form.append("type", "search");
            await this.$http.post(`${process.env.VUE_APP_ES_BASE_URL}/elections`, form).then(response => {
                this.elections = response.data.data;
                this.scroll_id = response.data.scroll_id;
                this.$store.dispatch('setLoading', false)
            })
            console.log(old_search)
            console.log(new_search)
            if (new_search == "") {
                this.refreshTab();
            }
        },
        async tab(new_tab) {
            if (new_tab == "tab-1") {
                this.elections = [];
                this.emtpy_respnse = false;
                this.$store.dispatch('setLoading', true)
                await this.$http.get(`${process.env.VUE_APP_ES_BASE_URL}/elections`).then(response => {
                    this.elections = response.data.data;
                    this.scroll_id = response.data.scroll_id;
                    if (response.data.data.length == 0) {
                        this.emtpy_respnse = true;
                    }
                    this.$store.dispatch('setLoading', false)
                });
            }
            if (new_tab == "tab-2") {
                this.elections = [];
                this.emtpy_respnse = false;
                this.$store.dispatch('setLoading', true)
                let form = new FormData();
                form.append("type", "closing_soon");
                await this.$http.post(`${process.env.VUE_APP_ES_BASE_URL}/elections`, form).then(response => {
                    this.elections = response.data.data;
                    this.scroll_id = response.data.scroll_id;
                    if (response.data.data.length == 0) {
                        this.emtpy_respnse = true;
                    }
                    this.$store.dispatch('setLoading', false)
                });
            }
            if (new_tab == "tab-3") {
                this.elections = [];
                this.emtpy_respnse = false;
                this.$store.dispatch('setLoading', true)
                let form = new FormData();
                form.append("type", "Local");
                await this.$http.post(`${process.env.VUE_APP_ES_BASE_URL}/elections`, form).then(response => {
                    this.elections = response.data.data;
                    this.scroll_id = response.data.scroll_id;
                    if (response.data.data.length == 0) {
                        this.emtpy_respnse = true;
                    }
                    this.$store.dispatch('setLoading', false)
                });
            }
            if (new_tab == "tab-4") {
                this.elections = [];
                this.emtpy_respnse = false;
                this.$store.dispatch('setLoading', true)
                let form = new FormData();
                form.append("type", "National");
                await this.$http.post(`${process.env.VUE_APP_ES_BASE_URL}/elections`, form).then(response => {
                    this.elections = response.data.data;
                    this.scroll_id = response.data.scroll_id;
                    if (response.data.data.length == 0) {
                        this.emtpy_respnse = true;
                    }
                    this.$store.dispatch('setLoading', false)
                });
            }

        }
    },
    name: 'vote-card',
    methods: {
        refreshTab() {
            let old_tab = this.tab
            this.tab = null
            this.$nextTick(() =>
                this.tab = old_tab
            )
        },
        scroll() {
            let end = this.$refs.end;
            if (end.getBoundingClientRect().top <= window.innerHeight) {
                let form = new FormData();
                form.append("scroll_id", this.scroll_id);
                this.$store.dispatch('setLoading', true)
                this.$http.post(`${process.env.VUE_APP_ES_BASE_URL}/elections/scroll`, form).then(response => {
                    if (response.data.data.length == 0) {
                        this.$store.dispatch('setLoading', false)
                        return;
                    }
                    for (let i = 0; i < response.data.data.length; i++) {
                        this.elections.push(response.data.data[i]);
                    }
                    this.scroll_id = response.data.scroll_id;
                    this.$store.dispatch('setLoading', false)
                });
            }
        }
    },
    data: () => ({
        tab: null,
        scroll_id: null,
        emtpy_respnse: false,
        elections: [],
        bottom: false,
        search: null,
    }),
}
</script>
<style>
.election_view_padding {
    padding: 1em;
}
</style>
