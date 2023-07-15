<template>
  <div id="app">
    <img alt="Vue logo">
    <editor
      v-model="data"
      :init="{
        height: 1000,
        menubar: true,
        plugins: [
          'advlist autolink lists link image charmap print preview anchor',
          'searchreplace visualblocks code fullscreen',
          'insertdatetime media table paste code help wordcount'
        ],
        toolbar:
          'undo redo | formatselect | bold italic backcolor | \
          alignleft aligncenter alignright alignjustify | \
          bullist numlist outdent indent | removeformat '
      }"
    />
  </div>
</template>

<script>
import Editor from '@tinymce/tinymce-vue'

export default {
  name: 'app',
  data() {
    return {
      data: 'Welcome to Your Vue.js App'
    }
  },
  components: {
    'editor': Editor
  }
}
</script>