<template>
  <div>
    <p class="md-caption">{{$tc('domain', 2)}}</p>
    <md-card>
      <md-card-content>
        <div class="permission-domains" v-for="(title, key) in {member: $t('organization.domains'), guest: $t('guest.domains')}">
          <div class="permission-domains-label">{{title}}</div>
          <div class="permission-domains-container">
            <div class="permission-domains-entry" v-for="(domain, index) in (values[key] || [])">
              <md-input-container md-inline>
                <label>{{$tc('domain', 1)}}</label>
                <md-input required :value="domain" @change="onDomainChange(key, index, $event)"></md-input>
              </md-input-container>
              <md-button class="md-icon-button" @click="removeDomain(key, index)">
                <md-icon>clear</md-icon>
              </md-button>
            </div>
            <md-button class="md-link" v-if="(!values[key] || values[key].length < 5) && isValid(key)" @click="addDomain(key)">{{$t('addDomain')}}</md-button>
          </div>
        </div>
      </md-card-content>
      <md-card-actions>
        <md-button @click="save('member|guest')" class="md-primary md-raised" :disabled="!hasChanged('member|guest')">{{$t('actions.save')}}</md-button>
        <md-button @click="reset('member|guest')" :disabled="!hasChanged('member|guest', true)">{{$t('actions.reset')}}</md-button>
        <span style="flex: 1"></span>
      </md-card-actions>
      <md-message :status="saved['member|guest']"></md-message>
    </md-card>
  </div>
</template>

<script>
  import Base from '../base';

  export default {
    extends: Base,
    props: ['organization'],
    bindToFirebase: true,
    firebasePath() {
      return '/security/organizations/' + this.organization.key + '/domains';
    },
    validate: {
      member: 'isDomainArrayValid',
      guest: 'isDomainArrayValid'
    },
    methods: {
      isDomainArrayValid(domainArray) {
        let valid = true;
        (domainArray || []).forEach((domain) => {
          valid = valid && this.isDomainValid(domain);
        });
        return valid;
      },
      isDomainValid(domain) {
        return typeof domain === 'string' && domain.match(/^(?!-)(?:[a-zA-Z\d-]{0,62}[a-zA-Z\d]\.){1,126}(?!\d+)[a-zA-Z\d]{1,63}$/);
      },
      onDomainChange(type, index, domain) {
        const newDomains = this.values[type].slice(0);
        newDomains[index] = domain;
        this.onChange(type, newDomains);
      },
      addDomain(type) {
        const newDomains = (this.values[type] || []).slice(0).concat('');
        this.$set(this.values, type, newDomains);
        this.$set(this.errors, type, true);
      },
      removeDomain(type, index) {
        const newDomains = (this.values[type] || []).slice(0);
        newDomains.splice(index, 1);
        this.$set(this.values, type, newDomains);
        this.onChange(type, this.firebaseObject.hasOwnProperty(type) ? newDomains : '');
      }
    }
  };
</script>

<style lang="scss" rel="stylesheet/scss">
  .permission-domains {
    margin-top:6px;
    & + & {
      margin-top: 24px;
    }
    position: relative;
    display: flex;
    flex-flow: row wrap;
    .permission-domains-label {
      min-width: 164px;
    }
    .permission-domains-container {
      flex: 1;
      .permission-domains-entry {
        width: 100%;
        display: flex;
        flex-flow: row wrap;
        &:last-of-type {
          margin-bottom: -22px;
        }
        .md-input-container {
          flex: 1;
          margin-top: 0;
          margin-bottom: 0;
          position: relative;
          top: -22px;
        }
        .md-icon-button {
          top: -8px;
        }
      }
      > .md-button {
        margin-top: 16px;
        &:first-child {
          margin-top: 0;
        }
      }
    }
  }
</style>