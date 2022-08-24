(impl-trait .sip010-ft-trait.ft-trait)
;; dai-coin
;; <add a description here>

;; constants
;;

(define-fungible-token dai-coin)
(define-constant err-owner-only (err u101))
(define-constant err-not-token-owner (err u102))

;; data maps and vars
;;

;; private functions
;;

;; public functions
;;

(define-read-only (get-total-supply) 
    (ok (ft-get-supply dai-coin))
)

(define-read-only (get-name) (ok "Dai Coin"))

(define-read-only (get-symbol) (ok "DC"))

(define-read-only (get-decimals) (ok u6))

(define-read-only (get-balances (who principal)) 
    (ok (ft-get-balance dai-coin who))
)

(define-public (get-token-uri) 
    (ok (some u"uri"))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal) (memo (optional (buff 34)))) 
    (begin 
        (asserts! (is-eq tx-sender sender) err-owner-only)
        (try! (ft-transfer? dai-coin amount sender recipient))
        (match memo to-print (print to-print) 0x)
        (ok true)
    )
)

(begin 
    (ft-mint? dai-coin u10000000000 tx-sender)
)



