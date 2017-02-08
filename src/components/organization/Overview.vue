<template>
  <div class="scroll-container">
    <md-toolbar class="md-dense">
      <h2 class="md-title">{{$t('overview')}}</h2>
    </md-toolbar>
    <div class="scroll-content">
      <p class="md-caption">What's hot</p>
      <md-card>
        <md-card-content>
          <journal :organization="organization"></journal>
        </md-card-content>
      </md-card>
    </div>
  </div>
</template>

<script>
  import Journal from './Journal';
  
  export default {
    components: { Journal },
    props: {
      organization: Object
    }
  };
</script>