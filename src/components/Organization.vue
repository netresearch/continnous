<template>
  <div id="organization" class="full-height">
    <template v-if="organization && Current.user && role">
      <md-toolbar :class="['app-nav', 'md-nav-bar', {'md-navbar-vert': navbarVert, 'app-nav-xsmall': Object.keys(resources).length * 40 + (role === 'admin' ? 40 : 0) + 284 >= $root.width }]">
        <router-link class="md-app-icon" :to="getUrlPath()" exact>
          <img v-if="organizationIcon !== undefined" :src="organizationIcon || '/static/app-icon.png'"/>
        </router-link>
        <div style="flex: 1" class="app-resource-buttons-center"></div>
        <div class="md-navbar-button-group app-resource-buttons">
          <md-link-button class="md-icon-button" :to="getUrlPath({search: true})">
            <md-icon>search</md-icon>
            <md-tooltip :md-direction="tooltipDirection">{{$t('search')}}</md-tooltip>
          </md-link-button>
          <hr>
          <md-link-button
              class="md-icon-button"
              v-for="(resource, key) in resources"
              :to="getUrlPath({type: key, archive: prefs.archive, personal: prefs.personal})"
          >
            <md-icon>{{resource.icon}}</md-icon>
            <md-tooltip :md-direction="tooltipDirection">{{$tc(key + '.title', 2)}}</md-tooltip>
          </md-link-button>
          <hr>
          <div class="speed-dial-container">
            <md-speed-dial :md-direction="navbarVert ? 'right' : 'bottom'" @click.native="createSpeedDialOpen = !createSpeedDialOpen">
              <md-button class="md-icon-button" md-fab-trigger>
                <md-icon md-icon-morph>close</md-icon>
                <md-icon>add</md-icon>
                <md-tooltip :md-direction="tooltipDirection" v-show="!createSpeedDialOpen">{{$t('actions.create')}}</md-tooltip>
              </md-button>
              <md-link-button
                  v-for="(resource, key) in resources"
                  v-if="permissions[key].write || permissions['personal_' + key].write"
                  :to="getUrlPath({type: key, create: true})"
                  class="md-fab md-primary md-mini md-clean"
              >
                <md-icon>{{resource.icon}}</md-icon>
              </md-link-button>
            </md-speed-dial>
          </div>
        </div>
        <div style="flex: 1"></div>
        <md-menu md-size="6" :md-direction="navbarVert ? 'top right' : 'bottom left'" md-align-trigger @open="whatshotOpen = true" @close="whatshotOpen = false">
          <md-button class="md-icon-button" :class="whatshotOpen ? 'md-active' : null" md-menu-trigger>
            <md-icon>whatshot</md-icon>
            <md-tooltip :md-direction="tooltipDirection">{{$t('whatshot')}}</md-tooltip>
          </md-button>
          <md-menu-content class="md-dense">
            <journal></journal>
          </md-menu-content>
        </md-menu>
        <md-link-button v-if="role === 'admin'" :to="getUrlPath({settings: true})" class="md-icon-button">
          <md-icon>settings</md-icon>
          <md-tooltip :md-direction="tooltipDirection">{{$t('settings.title')}}</md-tooltip>
        </md-link-button>
        <account-switcher :md-direction="navbarVert ? 'top right' : 'bottom left'"></account-switcher>
      </md-toolbar>
      <div class="app-content full-height">
        <router-view></router-view>
      </div>
    </template>

    <md-message
        v-if="!organization"
        :status="organization === undefined || !auth.ready ? 0 : (organization === false ? -2 : (organization === null ? -1 : 1))"
        :timeout="0"
        splash>
      <div v-if="organization === null">
        {{$t('errors.404')}}
      </div>
      <div v-else-if="organization === false">
        <div>
          {{$t('errors.' + (Current.user ? 403 : 401))}}
        </div>
        <md-button :class="{'md-raised': true, 'md-primary': !Current.user || role}" @click.native="auth.login()">{{$t('auth.' + (Current.user ? 'switchAccount' : 'signIn'))}}</md-button>
        <md-button class="md-raised md-primary" v-if="Current.user && !role" @click.native="requestMembership">{{$t('auth.requestMembership')}}</md-button>
        <p v-else-if="Current.user && role">{{$t('auth.membership' + (role === '!' ? 'Denied' : 'Processed'))}}.</p>
      </div>
    </md-message>
  </div>
</template>

<script>
  import Firebase from 'firebase';
  import AccountSwitcher from './AccountSwitcher';
  import Journal from './organization/common/Journal';
  import Organization from '../models/Organization';
  import Config from '../models/Config';
  import Permissions from '../models/Permissions';
  import Flashlight from '../models/Flashlight';
  import locales from '../locales';
  import File from '../models/File';
  import Current from '../models/Current';
  import auth from '../auth';
  import Store from '../models/Store';

  /* global document */
  const titleElements = document.querySelectorAll(
    'html > head > title,' +
    'html > head > meta[name="application-name"],' +
    'html > head > meta[name="apple-mobile-web-app-title"]'
  );
  const defaultTitle = titleElements[0].innerHTML;
  const setTitle = (title) => {
    titleElements.forEach((el) => {
      if (el.tagName.toLowerCase() === 'title') {
        el.innerText = title;
      } else {
        el.setAttribute('content', title);
      }
    });
  };

  const iconElements = document.querySelectorAll('html > head > link[rel="icon"]');
  const defaultIcons = [];
  iconElements.forEach((element) => {
    defaultIcons.push(element.getAttribute('href'));
  });
  const setIcon = (isFavicon, src) => {
    iconElements.forEach((element, i) => {
      if (!isFavicon || element.getAttribute('type') === 'image/x-icon') {
        element.setAttribute('href', src || defaultIcons[i]);
      }
    });
  };

  export default {
    components: {
      AccountSwitcher,
      Journal
    },
    props: {
      domain: String
    },
    data() {
      return {
        organization: undefined,
        organizationIcon: undefined,
        role: undefined,
        permissions: new Permissions(),
        Current,
        auth,
        title: undefined,
        key: undefined,
        whatshotOpen: false,
        createSpeedDialOpen: false,
        prefs: Store.bind('prefs', { archive: false, personal: false })
      };
    },
    computed: {
      navbarVert() {
        const $root = this.$root;
        return Math.min($root.height, $root.width) > $root.breakpoints.xsmall;
      },
      tooltipDirection() {
        return this.navbarVert ? 'right' : 'bottom';
      },
      resources() {
        const resources = {};
        const permissions = this.permissions;
        Object.keys(Config.resources).forEach((key) => {
          if (
            permissions[key].write
            || permissions['personal_' + key].write
            || permissions[key].read
            || permissions['personal_' + key].read
          ) {
            resources[key] = Config.resources[key];
          }
        });
        return resources;
      }
    },
    watch: {
      $route: {
        immediate: true,
        handler($route) {
          if ($route.params.organization_key) {
            this.key = $route.params.organization_key;
          }
        }
      },
      domain: {
        immediate: true,
        handler(domain) {
          if (domain) {
            Firebase.database().ref('domains/' + domain.replace(/\./g, ':')).once('value',
              (sn) => {
                this.key = sn.val();
              },
              () => {
                locales.setFromNavigator().then(() => {
                  this.organization = false;
                });
              }
            );
          }
        }
      },
      key: {
        immediate: true,
        handler: 'fetchOrganization'
      },
      'Current.user': 'fetchRoleAndPermissions',
      organization: 'fetchRoleAndPermissions'
    },
    methods: {
      fetchOrganization(organizationKey) {
        const key = organizationKey || this.organization && this.organization.key;
        if (!key || (this.organization && this.organization.key === key)) {
          return;
        }
        if (this.orgsRef) {
          this.orgsRef.off('value');
        }
        this.orgsRef = Firebase.database().ref('organizations/' + key);
        this.orgsRef.on('value',
          (snapshot) => {
            if (snapshot.val()) {
              const organization = new Organization(snapshot.key, snapshot.val());
              Current.user.bind(organization).once('value', (sn) => {
                const ul = sn.val() ? sn.val().lang : null;
                (ul ? locales.set(ul) : locales.setFromNavigator()).then(() => {
                  this.organization = organization;
                  Current.organization = organization;
                  if (this.organization.theme) {
                    this.$material.registerAndSetTheme(snapshot.key, this.organization.theme);
                  }
                  this.title = this.organization.title || (this.organization.name + ' ' + this.$t('thisPlatform'));
                  this.organizationIcon = undefined;
                  setTitle(this.title);
                  ['icon', 'favicon'].forEach((type, isFavicon) => {
                    if (this.organization[type]) {
                      File.getURL(this.organization[type].id, (src) => {
                        setIcon(isFavicon, src);
                        if (!isFavicon) {
                          this.organizationIcon = src;
                        }
                      });
                    } else {
                      setIcon(isFavicon, null);
                      if (!isFavicon) {
                        this.organizationIcon = null;
                      }
                    }
                  });
                });
              });
            } else {
              locales.setFromNavigator().then(() => {
                this.organization = null;
                Current.organization = undefined;
                this.title = null;
                setTitle(defaultTitle);
              });
            }
          },
          () => {
            locales.setFromNavigator().then(() => {
              this.organization = false;
              Current.organization = undefined;
              /* global window */
              window.setTimeout(() => {
                this.fetchOrganization(organizationKey);
              }, 1000);
            });
          }
        );
      },
      fetchRoleAndPermissions() {
        this.$nextTick(() => {
          const user = Current.user;
          const orgKey = this.key;
          Current.permissions = this.permissions;
          this.permissions.bind(orgKey, user, () => {
            this.role = this.permissions.role;
            if ((this.role || this.organization) && user) {
              const hasRole = this.role && this.role !== '?' && this.role !== '!';
              const userRef = user.bind(orgKey);
              if (hasRole) {
                const userData = { lastVisit: +new Date() };
                userRef.once('value', (sn) => {
                  if (sn.val().inviteState === -1) {
                    // State -1 means invitation was sent
                    // State 1 means notify the host about accepted invite
                    // @see InvitationStates
                    userData.inviteState = 1;
                  }
                  userRef.update(userData);
                });
              }
              if (this.role) {
                Firebase.database().ref('users/' + user.uid + '/organizations/' + orgKey)
                  .set(hasRole);
              }
            }
            if (this.organization && user) {
              // Update flashlight index paths
              Flashlight.updatePaths(orgKey, user.uid, this.permissions);
            }
          });
        });
      },
      requestMembership() {
        const user = Current.user;
        const orgKey = this.key;
        Firebase.database().ref('/security/organizations/' + orgKey + '/users/' + user.uid).set('?');
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  #organization {
    .organization-resource-nav {
      text-align: center;
    }
    .app-nav {
      position: relative;
      z-index: 2;
      flex-wrap: nowrap;
    }
    .app-content {
      position: relative;
      z-index: 1;
    }
    .app-nav:not(.md-navbar-vert) .app-resource-buttons {
      white-space: nowrap;
    }
    .app-nav-xsmall {
      padding-bottom: 48px;
      .app-resource-buttons {
        position: absolute;
        left: 0;
        right: 0;
        padding: 4px 0 0;
        bottom: 0;
        background: rgba(#000, 0.12);
      }
    }
    .app-nav.md-navbar-vert {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      & + .app-content {
        padding-left: 64px;
      }
      .app-resource-buttons-center {
        display: none;
      }
    }
    .app-content {
      .scroll-content {
        padding: 16px;
      }
      > .scroll-container > .scroll-content {
        padding-top: 0;
        > .md-nav-bar {
          margin-bottom: 16px;
          position: sticky;
          top: 0;
          z-index: 3;
          border-bottom: 2px solid rgba(#000, 0.08);
          &:before {
            content: " ";
            display: block;
            background: #F5F5F5;
            position: absolute;
            z-index: -1;
            left: -16px;
            right: -16px;
            top: 0;
            bottom: 0;
          }
        }
        > .md-nav-bar + div {
          position: relative;
          z-index: 1;
        }
      }
    }
  }
</style>