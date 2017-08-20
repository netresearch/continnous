<template>
  <div class="auth">
    <template v-if="auth.ready">
      <md-button @click.native="auth.login()" v-if="!Current.user">Login</md-button>
      <md-menu md-direction="bottom left" md-size="6" v-else>
        <md-avatar-button md-menu-trigger><img :src="Current.user.photoURL"></md-avatar-button>
        <md-menu-content>
          <div class="account-card">
            <md-avatar class="md-large">
              <img :src="Current.user.photoURL">
            </md-avatar>
            <div class="account-card-info">
              <div>{{Current.user.email}}</div>
              <div class="author-card-links">
                <md-button class="md-primary md-link" @click.native="auth.logout()">Logout</md-button>
              </div>
              <div class="account-language">
                <hr>
                <md-input-container>
                  <label>{{$t('language.language')}}</label>
                  <md-select v-model="language">
                    <md-option v-for="l in languages" :value="l">{{$t('language.' + l)}}</md-option>
                  </md-select>
                </md-input-container>
              </div>
            </div>
          </div>
        </md-menu-content>
      </md-menu>
    </template>
    <md-spinner v-else class="md-contrast" md-indeterminate :md-size="40"></md-spinner>
  </div>
</template>

<script>
  import locales from '../locales';
  import auth from '../auth';
  import Current from '../models/Current';

  export default {
    data() {
      return {
        auth,
        languages: locales.available,
        language: locales.current(),
        Current
      };
    },
    watch: {
      language(lang) {
        this.language = lang;
        locales.set(lang);
        Current.user.ref().update({ lang });
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .auth {
    position: relative;
    min-height: 52px;
    min-width: 56px;
    .md-spinner {
      position: absolute;
      left: 50%;
      top: 50%;
      margin-top: -20px;
      margin-left: -20px;
    }
  }
  .account-card {
    padding: 8px 16px 0;
    display: flex;
    align-items: flex-start;
    .md-avatar {
      position: static;
      margin: 0;
    }
    .account-card-info {
      margin-top: 10px;
      display: flex;
      flex-flow: column;
      flex: 1;
      margin-left: 16px;
    }
  }
  .account-language {
    .md-input-container {
      margin-bottom: 16px;
    }
  }
</style>